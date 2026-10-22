// hooks/use-live-interview.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { getErrorMessage } from "@/lib/api/client";
import { startInterview } from "@/lib/api/sessions";
import { AudioPlayer } from "@/lib/audio/player";
import { createVad, type VadHandle } from "@/lib/audio/vad";
import { env } from "@/lib/env";
import { wsServerMessageSchema, type InterviewConfig, type WsClientMessage, type WsServerMessage } from "@/lib/schemas";
import { useInterviewStore } from "@/stores/interview-store";

export function useLiveInterview() {
  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const vadRef = useRef<VadHandle | null>(null);
  const audioEnabledRef = useRef(true);
  const closingRef = useRef(false); // true once we finished/cleaned up on purpose

  const send = useCallback((msg: WsClientMessage | ArrayBuffer) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(msg instanceof ArrayBuffer ? msg : JSON.stringify(msg));
  }, []);

  const beginListening = useCallback(() => {
    const s = useInterviewStore.getState();
    s.setPhase("listening");
    s.markListeningStarted();
    vadRef.current?.start();
  }, []);

  const cleanup = useCallback(() => {
    closingRef.current = true;
    vadRef.current?.destroy();
    vadRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
  }, []);

  // The MP3 for the current prompt: mic is muted while it plays (no echo), then the silence clock starts.
  const handleAudio = useCallback(
    async (buffer: ArrayBuffer) => {
      vadRef.current?.pause();
      useInterviewStore.getState().setPhase("speaking");
      try {
        await playerRef.current?.play(buffer);
      } catch {
        /* decode/play failed: carry on so the server isn't left waiting */
      }
      send({ type: "playback_done" });
      beginListening();
    },
    [beginListening, send]
  );

  const handleServerMessage = useCallback(
    (msg: WsServerMessage) => {
      const store = useInterviewStore.getState();

      switch (msg.type) {
        case "intro":
        case "question":
        case "repeat":
          store.showPrompt({ kind: msg.type, text: msg.text, skill: msg.skill ?? null });
          if (audioEnabledRef.current) store.setPhase("speaking"); // MP3 frame (or tts_unavailable) follows
          else beginListening(); // text-only prompt: the user can answer right away
          break;

        case "tts_unavailable":
          store.setTtsAvailable(false);
          beginListening(); // the server is not waiting for playback_done in this case
          break;

        case "skipped":
          vadRef.current?.pause();
          store.recordSkipped();
          store.setPhase("processing");
          break;

        case "error":
          store.setNotice(msg.detail); // non-fatal: the server re-asks the question next
          break;

        case "report":
          closingRef.current = true;
          store.setReport(msg.report, msg.end_reason ?? null, msg.detail ?? null);
          vadRef.current?.destroy();
          vadRef.current = null;
          playerRef.current?.close();
          playerRef.current = null;
          wsRef.current?.close();
          break;
      }
    },
    [beginListening]
  );

  const openSocket = useCallback(
    (wsPath: string, audio: boolean) => {
      const ws = new WebSocket(`${env.WS_URL}${wsPath}?audio=${audio}`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          let raw: unknown;
          try {
            raw = JSON.parse(event.data);
          } catch {
            return;
          }
          const parsed = wsServerMessageSchema.safeParse(raw);
          if (!parsed.success) {
            console.warn("Unknown WS message", raw);
            return;
          }
          handleServerMessage(parsed.data);
        } else if (event.data instanceof ArrayBuffer) {
          void handleAudio(event.data);
        }
      };

      ws.onclose = (event) => {
        vadRef.current?.pause();
        if (closingRef.current) return;
        useInterviewStore
          .getState()
          .setError(
            event.code === 4404
              ? "This interview session has expired. Please start a new one."
              : "The connection was lost. Please start a new interview."
          );
      };
    },
    [handleAudio, handleServerMessage]
  );

  /** Call from the "Start interview" click handler. */
  const start = useCallback(
    async (config: InterviewConfig) => {
      const store = useInterviewStore.getState();
      store.reset();
      store.setConfig(config);
      store.setPhase("creating");
      closingRef.current = false;
      audioEnabledRef.current = config.audio_enabled;

      // Must happen synchronously inside the click (autoplay policy)
      playerRef.current = new AudioPlayer();
      playerRef.current.unlock();

      // Ask for the mic while the backend pre-generates questions. If denied, text answers still work.
      const vadPromise = createVad({
        onSpeechStart: () => {
          send({ type: "speech_start" });
          useInterviewStore.getState().setPhase("userSpeaking");
        },
        onSpeechEnd: (wav) => {
          vadRef.current?.pause();
          useInterviewStore.getState().setPhase("processing");
          send(wav);
        },
        onMisfire: () => {
          send({ type: "speech_cancel" });
          useInterviewStore.getState().setPhase("listening");
        },
      }).catch(() => null);

      try {
        const session = await startInterview(config);
        store.setSession({ sessionKey: session.session_key, dbSessionId: session.db_session_id });
        store.setPhase("connecting");

        vadRef.current = await vadPromise;
        if (!vadRef.current) store.setMicAvailable(false);

        openSocket(session.ws_path, config.audio_enabled);
      } catch (e) {
        (await vadPromise)?.destroy();
        store.setError(getErrorMessage(e));
      }
    },
    [openSocket, send]
  );

  const sendTextAnswer = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      vadRef.current?.pause();
      useInterviewStore.getState().setPhase("processing");
      send({ type: "answer", text: trimmed });
    },
    [send]
  );

  const endInterview = useCallback(() => {
    vadRef.current?.pause();
    useInterviewStore.getState().setPhase("processing");
    send({ type: "end" });
  }, [send]);

  useEffect(() => cleanup, [cleanup]); // close everything when the page unmounts

  return { start, sendTextAnswer, endInterview, cleanup };
}
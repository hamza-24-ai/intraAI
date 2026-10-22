// lib/audio/vad.ts
// Silero VAD in the browser. Assets must be in /public/vad (see scripts/copy-vad-assets.mjs).
export interface VadHandle {
  start: () => void;
  pause: () => void;
  destroy: () => void;
}

export interface VadHandlers {
  onSpeechStart: () => void;
  onSpeechEnd: (wav: ArrayBuffer) => void;
  onMisfire: () => void;
}

export async function createVad(handlers: VadHandlers): Promise<VadHandle> {
  // Dynamic import: the library touches `window`, so it must never load during the Next.js build.
  const { MicVAD, utils } = await import("@ricky0123/vad-web");

  const vad = await MicVAD.new({
    baseAssetPath: "/vad/",
    onnxWASMBasePath: "/vad/",
    startOnLoad: false,
    redemptionMs: 1500, // a short pause mid-answer doesn't end the answer
    onSpeechStart: handlers.onSpeechStart,
    // Explicit 16 kHz mono 16-bit PCM: the format the backend's STT step expects
    onSpeechEnd: (audio: Float32Array) => handlers.onSpeechEnd(utils.encodeWAV(audio, 1, 16000, 1, 16)),
    onVADMisfire: handlers.onMisfire,
  });

  return {
    start: () => vad.start(),
    pause: () => vad.pause(),
    destroy: () => vad.destroy(),
  };
}
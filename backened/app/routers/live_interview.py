import asyncio
import json 
import datetime
import time
from typing import Optional
from fastapi import APIRouter,HTTPException,status, WebSocket, WebSocketDisconnect, Depends
from app.cores.auth_dependancy import get_db_user, get_optional_db_user
from app.cores.database import get_db, Session_Local
# import tables

from app.models.interview_sessions import Interview_Session
from app.models.answers import Answer
from app.models.evaluations import Evaluation
from app.models.questions import Question
from app.models.feedback_reports import FeedBack_Report

# import memory distionary 

from app.services.resume_context import resolve_resume
from app.routers.live_sessions import ACTIVE_SESSIONS

# import graph pipelines from live graph file 
from app.agent.livegraph import live_graph, select_next_question

# import agents to make things done
from app.agent.feedback_synthesis_agent import feedback_synthesis_agent
from app.agent.tts_preprocessor import prepare_for_speech
from app.services.stt import STTError, transcribe_audio
from app.services.tts import synthesize_speech

MAX_ANSWER_SECONDS = 150      # cap on speaking time once the user has started talking
PLAYBACK_WAIT_SECONDS = 40    # safety net if the client never sends playback_done



# Generate Router 
router = APIRouter(tags=["Live Interview WebSocket"])

# Genrate starting with TimeOut
INTRO_TEXT = "Hello, thanks for joining us today. Before we begin your interview, could you briefly introduce yourself?"
INTRO_TIME_OUT = 45
ANSWER_TIME_OUT = 20

# whisper ya eleven labs ka function jaha sa STT & TTS workOut hoga 

async def transcribe_audio(audio_bytes : bytes) -> str:
    raise NotImplementedError(
        "Currently voice to text Pipeline is not implemented"
    )

async def synthesize_speech(text : str) -> bytes:
    raise NotImplementedError(
        "Currently text to voice Pipeline is not implemented"
    )


# Send question to client 

# async def send_question(ws : WebSocket, text : str, audio : bool, skill = None, kind = "question"):
#     await ws.send_json({
#         "type" : kind,
#         "text" : text,
#         "skill" : skill
#     })

#     if audio:

#         await ws.send_bytes(await synthesize_speech(text))


# # recieving data from user
# async def utternace_receive(ws : WebSocket, timeout : int) -> Optional[str]:

#     try:
#         msg = await asyncio.wait_for(ws.receive(), timeout=timeout)
#     except asyncio.TimeoutError:
#         return ""

#     if msg["type"] == "websocket.disconnect":
#         raise WebSocketDisconnect()

#     if msg.get("bytes"):
#         return await trnscribe_audio(msg["bytes"])

#     data = json.loads(msg["text"])
#     if data.get("type") == "end":
#         return None

#     return data["text", ""]


async def wait_playback_done(ws: WebSocket):
    """The silence clock must start only AFTER the question finished playing on the client."""
    try:
        while True:
            msg = await asyncio.wait_for(ws.receive(), timeout=PLAYBACK_WAIT_SECONDS)
            if msg["type"] == "websocket.disconnect":
                raise WebSocketDisconnect()
            if msg.get("text") and json.loads(msg["text"]).get("type") == "playback_done":
                return
    except asyncio.TimeoutError:
        return


async def send_question(ws: WebSocket, text: str, audio: bool, skill=None, kind="question"):
    await ws.send_json({"type": kind, "text": text, "skill": skill})  # text always sent (captions)
    if not audio:
        return

    speech_text = await asyncio.to_thread(prepare_for_speech, text)
    audio_bytes = await synthesize_speech(speech_text)
    if audio_bytes is None:  # quota / network problem: degrade to text-only
        await ws.send_json({"type": "tts_unavailable"})
        return

    await ws.send_bytes(audio_bytes)
    await wait_playback_done(ws)


async def utternace_receive(
    ws: WebSocket, silence_timeout: int, vocab_hint: str = "", transcribe: bool = True
) -> Optional[str]:
    """Answer text, "" if the user stayed silent, None if the client ends the interview."""
    timeout = silence_timeout
    while True:
        try:
            msg = await asyncio.wait_for(ws.receive(), timeout=timeout)
        except asyncio.TimeoutError:
            return ""
        if msg["type"] == "websocket.disconnect":
            raise WebSocketDisconnect()

        if msg.get("bytes"):
            if not transcribe:
                return "(intro)"
            text = await transcribe_audio(msg["bytes"], vocab_hint)
            if not text:
                raise STTError("empty transcript")  # heard something, couldn't read it: ask again, don't score 0
            return text

        data = json.loads(msg["text"])
        kind = data.get("type")
        if kind == "end":
            return None
        if kind == "answer":  # text mode / testing
            return data.get("text", "")
        if kind == "speech_start":
            timeout = MAX_ANSWER_SECONDS      # user is talking: stop the silence clock
        elif kind == "speech_cancel":
            timeout = silence_timeout         # VAD false alarm: clock starts again

# db ma data ko store krna 

def persist_turn(state, turn, answer_text, evaluation, db = Depends(get_db)):

    if not state.get("db_session_id"):
        return 


    try:
        q = Question(
            session_id = state["db_session_id"],
            skill = turn["skill"],
            question_type = state["interview_type"],
            question_text = turn["question_text"],
            difficulty_level = turn["difficulty_level"],
            order_index = turn["order"]

        )

        db.add(q)
        db.flush()

        a = Answer(
            question_id = q.id,
            transcribed_text = answer_text,
            was_skipped = state.get("was_skipped", False)
        )

        db.add(a)
        db.flush()

        e = Evaluation(
            answer_id = a.id,
            score = evaluation["overall_score"],
            evaluation_summary=(
                    "Strengths: " + "; ".join(evaluation.get("strengths", []))
                    + " | Weaknesses: " + "; ".join(evaluation.get("weaknesses", []))
            ),
            skill_gap_notes = "; ".join(evaluation.get("weaknesses", []))
        )

        db.add(e)

        db.commit()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error has occured while working on your request"
        )

# save data in feedback report 

def persist_report_and_close(state, report, status):

    db_session_db = state.get("db_session_db")
    if not db_session_db:
        return 

    db = Session_Local()

    try:
        fr = FeedBack_Report(
            session_id = db_session_db,
            overall_score = report["overall_score"],
            strengths = report["strengths"],
            weaknesses = report["weaknesses"],
            improvement_suggestions = report["improvement_suggestions"]
        )

        db.add(fr)

        session = db.get(Interview_Session, db_session_db)

        session.status = status
        session.ended_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()


# final report bna kr client ko dena 

async def finish_interview(ws : WebSocket, state):
    report = None

    if state.get("all_evaluations"):
        if not state.get("final_feedback_report"):
            await asyncio.to_thread(feedback_synthesis_agent, state)

        report = state.get("final_feedback_report")

    await ws.send_json({
        "type" : "report",
        "report" : report,
        "end_reason" : state.get("end_reason"),
        "detail" : None if report else state.get("error") or "No report has recorded"
    })

    return report, state


# making the router of the interview

@router.websocket("/ws/interview/{session_key}")
async def interview_ws(ws : WebSocket, session_key : str, audio : bool = True):

    await ws.accept()
    state = ACTIVE_SESSIONS.get(session_key)
    if state is None:
        await ws.send_json({
            "type" : "error",
            "detail" : "unknown or expired session!"
        })

        return

    report = None
    status = "abondened"

    try:
        #  Opening interview starting

        await send_question(ws, INTRO_TEXT, audio, kind = "intro")
        await utternace_receive(ws, INTRO_TIME_OUT, Transcribe = False)

        state["session_start_timestamp"] = time.time()
        state["next_action"] = "start"

        state = await asyncio.to_thread(select_next_question, state)
        await send_question(ws, state["current_question_text"], audio, state["current_skill"])

        while True:
            # answer = await utternace_receive(ws, ANSWER_TIME_OUT)
            try:
                answer = await utternace_receive(ws, ANSWER_TIME_OUT, ", ".join(state["skills"]))
            except STTError:
                await ws.send_json({"type": "error", "detail": "I couldn't hear that clearly. Please try again."})
                await send_question(ws, state["current_question_text"], audio, state["current_skill"], kind="repeat")
                continue

            if answer is None:
                state["interveiw_type"] = True
                state["end_reason"] = "ended_by_user"
                state, report = await finish_interview(ws, state)
                status = "completed" if report else "abondened"
                break


            # kya poocha gya graph ko next state ma move krna

            turn = {
               "question" : state["current_question"],
               "skill" : state["current_skill"],
               "difficulty" : state["difficulty_level"],
               "order" : state["questions_asked_count"] 
            }

            # hr flag pa return hojana
            status.update({
                "is_repeat_request" : False,
                "repeat_limit_reached": False,
                "was_skipped": not answer.strip(),
                "raw_answer_transcript": answer,
                "cleaned_answer_transcript": "",
                "error": None,
            }) 

            if state["was_skipped"]:
                await ws.send_json({
                    "type" : "skipped"
                })

            state = await asyncio.to_thread(live_graph.invoke, state)
            ACTIVE_SESSIONS[session_key] = state

            if state.get("error"):
                await ws.send_json({
                    "type" : "error",
                    "detail" : state["error"]
                })

                state["error"] = None
                await send_question(ws, turn["question"], audio, turn["skill"], kind="repeat")
                continue

            if state.get("is_repeat_request"):
                await send_question(ws, state["current_question"], audio, state["current_skill"], kind="repeat")
                continue

            await asyncio.to_thread(persist_turn, state, turn, answer, state["current_evaluation"])

            if state.get("interview_ended"):
                state, report = await finish_interview(ws, state)
                status = "completed"
                break

            await send_question(ws, state["current_question"], audio, state["current_skill"])

        await ws.close()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "detail": str(e)})
            await ws.close(code=1011)
        except Exception:
            pass
    finally:
        await asyncio.to_thread(persist_report_and_close, state, report, status)
        ACTIVE_SESSIONS.pop(session_key, None)


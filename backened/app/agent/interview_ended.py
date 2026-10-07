import time

from app.agent.state import Agent_Pipeline


def check_interview_ended(state: Agent_Pipeline) -> Agent_Pipeline:
    

    session_start_time = state.get("session_start_timestamp")
    duration_minutes = state.get("duration_minutes", 15)
    questions_asked_count = state.get("questions_asked_count", 0)

    # Safety cap — even if duration tracking somehow fails, don't let
    
    MAX_QUESTIONS_SAFETY_CAP = 25

    if session_start_time is None:
        # Shouldn't happen in a real session
        state["interview_ended"] = False
        return state

    elapsed_minutes = (time.time() - session_start_time) / 60

    if elapsed_minutes >= duration_minutes:
        state["interview_ended"] = True
        state["end_reason"] = "duration_reached"
    elif questions_asked_count >= MAX_QUESTIONS_SAFETY_CAP:
        state["interview_ended"] = True
        state["end_reason"] = "max_questions_reached"
    else:
        state["interview_ended"] = False
        state["end_reason"] = None

    return state
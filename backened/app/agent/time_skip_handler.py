import time 
from app.agent.state import Agent_Pipeline







def time_skip_handler(state : Agent_Pipeline) -> Agent_Pipeline:
    SILENCE_THRESHOLD_SECONDS = 14

    last_speech_end_time = state.get("last_speech_end_transcript")
    current_time = time.time()

    if last_speech_end_time is None:
        state["was_skipped"] = False
        return state

    elapsed = current_time - last_speech_end_time

    if elapsed >= SILENCE_THRESHOLD_SECONDS:
        state["was_skipped"] = True
        state["clean_answer_transcript"] = ""
    else:
        state["was_skipped"] = False

    return state


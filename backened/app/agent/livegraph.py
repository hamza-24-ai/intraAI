from langgraph.graph import StateGraph, END
from app.agent.state import Agent_Pipeline

from app.agent.question_generator_agent import generated_question_by_llm

# Extract all agents
from app.agent.resume_parser_agent import resume_parser_agent
from app.agent.adpative_difficulty_controller import adaptive_difficulty_controller_agent
from app.agent.answer_evaluation_agent import evaluation_answer_agent
from app.agent.feedback_synthesis_agent import feedback_synthesis_agent
from app.agent.question_generator_agent import question_generator_agent
from app.agent.repeat_intent_classifier import repeat_classifier_agent
from app.agent.sttp_cleanUp_agent import sttp_cleanup_agent
from app.agent.time_skip_handler import time_skip_handler
from app.agent.file_info import extracter_file_data
from app.agent.interview_ended import check_interview_ended


def select_next_question(state : Agent_Pipeline) -> Agent_Pipeline:

    if state.get("error"):
        return state


    sets = state["question_sets"]
    action = state.get("next_action", "next_skill")


    if action == "next_skill":

        state["skill_index"] = (state["skill_index"] + 1)% len(sets)

    skill = sets[state["skill_index"]]["skill"]
    asked = state.get("asked_questions",[])
    candidates = []

    if action in ("follow_up", "easier", "harder"):
        try:
            result = generated_question_by_llm.invoke({
                "skill": skill,
                "target_role": state.get("target_role") or "Software Engineer",
                "difficulty_level": state["difficulty_level"],
                "search_context": "",
            })
            candidates += [q["question_text"] for q in result["questions"]]
        except Exception:
            pass

    candidates += [q["question_text"] for q in sets[state["skill_index"]["skill"]]]
    question = next((q for q in candidates if q not in asked), None)

    if question is None:
        state["interview_ended"] = True
        state["end_reason"] = "question exhausted"
        return state

    state["current_skill"] = skill
    state["current_question"] = question
    state["asked_questions"] = asked + [question]
    state["questions_asked_count"] = state.get("questions_asked_count", 0) + 1
    state["reach_count_current_question"] = 0
    state["reach_limit"] = False

    return state





      
def route_entry(state):
    return "answer_evaluator" if state.get("was_skipped") else "stt_cleanup"


def route_after_repeat(state):

    return "end" if state.get("is_repeat_request") else "answer_evaluator"

def route_after_and_check(state):
    return "feedback_synthesis" if state.get("interview_ended") else "select_next_question"


live = StateGraph(Agent_Pipeline)
live.add_node("stt_cleanup", sttp_cleanup_agent)
live.add_node("repeat_intent_classifier", repeat_classifier_agent)
live.add_node("answer_evaluator", evaluation_answer_agent)
live.add_node("difficulty_controller", adaptive_difficulty_controller_agent)
live.add_node("check_interview_ended", check_interview_ended)
live.add_node("select_next_question", select_next_question)
live.add_node("feedback_synthesis", feedback_synthesis_agent)


live.set_conditional_entry_point(
    route_entry, {"answer_evaluator": "answer_evaluator", "stt_cleanup": "stt_cleanup"}
)
live.add_edge("stt_cleanup", "repeat_intent_classifier")
live.add_conditional_edges(
    "repeat_intent_classifier", route_after_repeat, {"end": END, "answer_evaluator": "answer_evaluator"}
)
live.add_edge("answer_evaluator", "difficulty_controller")
live.add_edge("difficulty_controller", "check_interview_ended")
live.add_conditional_edges(
    "check_interview_ended",
    route_after_and_check,
    {"feedback_synthesis": "feedback_synthesis", "select_next_question": "select_next_question"},
)
live.add_edge("select_next_question", END)
live.add_edge("feedback_synthesis", END)

live_graph = live.compile()

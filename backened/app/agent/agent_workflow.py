from langgraph.graph import StateGraph, END

# import all Agents here to work 

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

# Import agent state to transfer data in each agent 

from app.agent.state import Agent_Pipeline


# make a graph variable 

graph = StateGraph(Agent_Pipeline)

# Make edges of each graph

graph.add_node("extracter_file_data", extracter_file_data)
graph.add_node("resume_parser_agent", resume_parser_agent)
graph.add_node("adaptive_difficulty_controller_agent", adaptive_difficulty_controller_agent)
graph.add_node("evaluation_answer_agent", evaluation_answer_agent)
graph.add_node("feedback_synthesis_agent", feedback_synthesis_agent)
graph.add_node("question_generator_agent", question_generator_agent)
graph.add_node("repeat_classifier_agent", repeat_classifier_agent)
graph.add_node("sttp_cleanup_agent", sttp_cleanup_agent)
graph.add_node("time_skip_handler", time_skip_handler)
graph.add_node("check_interview_ended", check_interview_ended)


# Making function of each graph 

def route_after_check_file_type(state : Agent_Pipeline) -> str:
    # By checking if the file type is valid what I demand or different 

    if not state.get("is_valid_file"):
        return "end_with_error"

    return "resume_parser_agent"


def route_after_resume_parser(state : Agent_Pipeline) -> str:
    # before generating question check the file type and any error 

    if state.get("error"):
        return "end_with_error"

    return "question_generator_agent"


def route_after_timeout(state : Agent_Pipeline) -> str:
    # Before evaluating the answer must check if the time is out 

    if state.get("was_skipped"):
        return "evaluation_answer_agent"

    return "sttp_cleanup_agent"

def route_after_stt_cleanup(state : Agent_Pipeline) -> str:
    # Checking that if clean answer is asking for repeat or clean answer

    if state.get("error"):
        return "end_with_error"

    return "repeat_classifier_agent"


def route_after_repeat_check(state : Agent_Pipeline) -> str:
    # checking if the repeat request is true or just false 

    if state.get("is_repeat_request"):
        return "re_ask_question"

    return "evaluation_answer_agent"

def route_after_answer_evaluation(state : Agent_Pipeline) -> str:
    # checking if there is error findOut

    if state.get("error"):
        return "end_with_error"

    return "adaptive_difficulty_controller_agent"

def route_after_difficulty_decision(state : Agent_Pipeline) -> str:
    # checking if interview is end 

    if state.get("is_interview_ended"):
        return "feedback_synthesis_agent"

    return "question_generator_agent"


# Making edges of each node

graph.set_entry_point("extracter_file_data")

graph.add_conditional_edges(
    "extracter_file_data",
    route_after_check_file_type,
    {
        "resume_parser_agent" : "resume_parser_agent",
        "end_with_error" : END
    }
)


graph.add_conditional_edges(
    "resume_parser_agent",
    route_after_resume_parser,
    {
        "question_generator_agent" : "question_generator_agent",
        "end_with_error" : END
    }
)


# Adding more edges to checking the interview 
# Question generator ko hm live interview ka lya aik loop ma rkha gaa or sath time handler bhi 

graph.add_edge("question_generator_agent", "time_skip_handler")

graph.add_conditional_edges(
    "time_skip_handler",
    route_after_timeout,
    {
        "evaluation_answer_agent": "evaluation_answer_agent",
        "sttp_cleanup_agent" : "sttp_cleanup_agent"
    }
)


graph.add_conditional_edges(
    "sttp_cleanup_agent",
    route_after_stt_cleanup,
    {
        "repeat_classifier_agent" : "repeat_classifier_agent",
        "end_with_error" : END
    }
    
)


graph.add_conditional_edges(
    "repeat_classifier_agent",
    route_after_repeat_check,
    {
        "evaluation_answer_agent" : "evaluation_answer_agent",
        "re_ask_question" : END
    }
)


graph.add_conditional_edges(
    "evaluation_answer_agent",
    route_after_answer_evaluation,
    {
        "adaptive_difficulty_controller_agent" : "adaptive_difficulty_controller_agent",
        "end_with_error" : END
    }
)


graph.add_conditional_edges(
    "adaptive_difficulty_controller_agent",
    route_after_difficulty_decision,
    {
        "feedback_synthesis_agent" : "feedback_synthesis_agent",
        "question_generator_agent" : "question_generator_agent"
    }
)

graph.add_edge(
    "check_interview_ended",
    "adaptive_difficulty_controller_agent"
)

graph.add_conditional_edges(
    "check_interview_ended",
    route_after_difficulty_decision,
    {
        "feedback_synthesis_agent" : "feedback_synthesis_agent",
        "question_generator_agent" : "question_generator_agent"
    }
)

graph.add_edge(
    "feedback_synthesis_agent" , END
)

# Graph Compilation 

compiled_graph = graph.compile()

# print mermaid graph 

print(compiled_graph.get_graph().draw_mermaid())


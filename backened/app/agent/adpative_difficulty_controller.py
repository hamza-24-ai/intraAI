from dotenv import load_dotenv
import os 
import json

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from app.agent.state import Agent_Pipeline

load_dotenv()

# Import env variables 
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

adaptive_llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model=GROQ_MODEL,
    temperature=0.2
)


# Making Output Parser

class DifficultyDecision(BaseModel):
    next_action : str = Field(description="follow_up | easier | harder | next_skill")
    reasoning : str = Field(description="Brief reason for this decision")
    next_difficulty_level : str = Field(description="beginner | intermediate | technical | deep")

parser = JsonOutputParser(pydantic_object=DifficultyDecision)

# Generating Prompt 

DIFFICULTY_CONTROLLER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You control the flow of a live technical interview based on 
how the candidate just performed.

Given the evaluation of their last answer, decide the next action:
- "follow_up": ask a deeper question on the SAME skill/topic (use when overall_score is 7-8.5, 
  candidate did well but there's room to probe deeper)
- "easier": ask an easier question on the same skill (use when overall_score < 4, 
  candidate is struggling)
- "harder": ask a more challenging question, possibly escalating difficulty tier 
  (use when overall_score > 8.5, candidate is clearly strong)
- "next_skill": move to a different skill from their resume (use when overall_score 
  is 4-7, adequate performance, no need to dwell further on this skill)

Also decide next_difficulty_level: beginner | intermediate | technical | deep — 
adjust up or down by at most one tier from the current level, based on your action.

Respond with ONLY valid JSON:
{{
  "next_action": "follow_up" | "easier" | "harder" | "next_skill",
  "reasoning": "...",
  "next_difficulty_level": "beginner" | "intermediate" | "technical" | "deep"
}}"""),
    ("human", """Current difficulty: {current_difficulty}
Current skill: {current_skill}

Last answer evaluation:
{evaluation_json}"""),
])


# LCEL CHAIN 
difficulty_controller_chain = DIFFICULTY_CONTROLLER_PROMPT | adaptive_llm | parser

# MAIN AGENT NODE
def adaptive_difficulty_controller_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    if state.get("error"):
        return state

    if state.get("is_repeat_request"):
        return state

    evaluation = state.get("current_evaluation")

    if not evaluation:
        state["error"] = "No Evaluation available to base difficulty decision on"
        return state

    try:
        decision = difficulty_controller_chain.invoke({
            "current_difficulty": state.get("difficulty_level","intermediate"),
            "current_skill": state.get("current_skill",""),
            "evaluation_json" : json.dumps(evaluation)
        })
    except Exception:
        decision = {
            "next_action": "next_skill",
            "reasoning": "Fallback due to controller beaviour",
            "next_difficulty_level": state.get("difficulty_level","")
        }

    state["next_action"] = decision["next_action"]
    state["difficulty_level"] = decision["next_difficulty_level"]

    return state

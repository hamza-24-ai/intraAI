from dotenv import load_dotenv
import os 
import json
from typing import List

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from app.agent.state import Agent_Pipeline

load_dotenv()

# Import Env variable to make llm 

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

feedback_llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model=GROQ_MODEL,
    temperature=0.3
)

class FeedBackReport(BaseModel):
    overall_score: float = Field(description="0-10, average across the whole interview")
    strengths: List[str] = Field(description="3-5, overall strength observed across the interview")
    weaknesses : List[str] = Field(description="3-5, overall weaknesses observed across whole interview")
    skill_gap_notes : List[str] = Field(description="specific skill/concepts candidate should revise")
    improvement_suggestions : List[str] = Field(description="Concrete, actionable next steps")

parser_feedback = JsonOutputParser(pydantic_object=FeedBackReport)

# FEEDBACK CHAT PROMPT TEMPLATE 

FEEDBACK_SYNTHESIS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You write the final feedback report for a candidate who just 
completed a mock {interview_type} interview for a {target_role} role.

You are given the full list of per-question evaluations from the session.
Synthesize them into one coherent report — do not just list each question's 
result again. Look for PATTERNS across the whole interview.

Be honest and specific. Avoid generic statements like "good communication skills" — 
instead say what specifically was strong or weak, tied to actual skills/topics.

Respond with ONLY valid JSON:
{{
  "overall_score": 0.0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "skill_gap_notes": ["..."],
  "improvement_suggestions": ["..."]
}}"""),
    ("human", "All question evaluations from this session:\n{all_evaluations_json}"),
])


# LCEL CHAIN 
feedback_synthesis_chain = FEEDBACK_SYNTHESIS_PROMPT | feedback_llm | parser_feedback


# Main Node Agent 
def feedback_synthesis_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    all_evaluation = state.get("all_evaluation","")

    if not all_evaluation:
        state["error"] = f"Feedback Synthesis Failed : {str(e)}"
        return state

    try:
        report = feedback_synthesis_chain.invoke({
            "interview_type": state.get("interveiw_type","technical"),
            "target_role": state.get("target_role","Software Engineer"),
            "all_evaluation_json": json.dumps(all_evaluation)
        })
    except Exception as e:
        state["error"] = f"Feedback Synthesis Failed : {str(e)}"
        return state

    state["final_feedback_report"] = report
    state["error"] = None

    return state

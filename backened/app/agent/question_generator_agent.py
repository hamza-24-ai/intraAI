from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser,JsonOutputParser
import os 
import json 
from app.agent.state import Agent_Pipeline
from langchain_community.tools.tavily_search import TavilySearchResults
from pydantic import BaseModel,Field
from dotenv import load_dotenv
from typing import List

load_dotenv()

# =====================================

# Upload Groq models

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

# Make LLM model 

llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model=GROQ_MODEL,
    temperature=0.4
)

# Upload Tavily api key 

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

tavily_search = TavilySearchResults(
    api_key=TAVILY_API_KEY,
    max_results=5
)


# =================================================================
# Output Schema Structured Questions 
# ===============================================================

class QuestionSet(BaseModel):
    question_text : str = Field(description="The interview questions")
    difficulty_level : str = Field(description="beginner | intermediate | technical | deep")


class GeneratedQuestion(BaseModel):
    skill : str = Field(description="Skill These questions are for")
    questions : List[QuestionSet] = Field("Questions Generated")


parser = JsonOutputParser(pydantic_object=GeneratedQuestion)

# ===============================================
# Template structure for LLM
# ==============================================


QUESTION_GEN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a technical interview question generator for a platform 
serving Pakistani CS/SE students preparing for {target_role} roles.

Given a skill, a difficulty level, and (optionally) real-world search context 
about interview questions asked in Pakistani tech companies, generate 5 relevant, 
well-formed interview questions.

Rules:
- Questions must match the requested difficulty level.
- Prefer questions grounded in the search context when it's relevant and useful.
- If search context is empty or irrelevant, generate from your own knowledge — 
  do not mention the absence of search results in the output.
- Do not repeat near-identical questions.

Respond with ONLY valid JSON matching this structure:
{{
  "skill": "skill name",
  "questions": [
    {{"question_text": "...", "difficulty_level": "..."}}
  ]
}}"""),
    ("human", """Skill: {skill}
Target role: {target_role}
Difficulty level: {difficulty_level}

Search context (may be empty):
{search_context}"""),
])

generated_question_by_llm = QUESTION_GEN_PROMPT | llm | parser


# ===========================================
# Getting interview questions through Tavily 
# ===========================

def question_by_tavily(skill : str, target_role : str) -> str:

    query = f"{skill} interview question Pakistani tech companies {target_role}"

    try:
        results = tavily_search.invoke({"query" : query})
    except Exception:
        return ""


    if not results:
        return ""

    context_part = []
    for r in results:
        content = r.get("content", "")
        if content:
            context_part.append(content[:500])

    return "\n\n".join(context_part)



# ==========================
# Agent NODE FOR LANGGRAPH CALL
# ==============================

def question_generator_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    if state.get("error"):
        return state

    skills = state.get("skills")
    target_role = state.get("target_role")

    if not skills:
        state["error"] = "Skills not Found"
        return state

    all_questions = []

    for skill in skills:
        search_context = question_by_tavily(skill,target_role)

        try:
            result = generated_question_by_llm.invoke({
                "search_context" : search_context,
                "skill" : skill,
                "target_role" : target_role,
                "difficulty_level" : "intermediate | deep"

                })
        except Exception:
            continue

        all_questions.append(result)

    state["question_sets"] = all_questions
    state["error"] = None

    return state




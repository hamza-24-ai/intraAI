from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser,JsonOutputParser
import os 
import json 
from concurrent.futures import ThreadPoolExecutor
from app.agent.state import Agent_Pipeline
# from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_tavily import TavilySearch
from pydantic import BaseModel,Field
from dotenv import load_dotenv
from typing import List

load_dotenv()

MAX_SKILLS_PER_GENERATION = int(os.getenv("MAX_SKILLS_PER_GENERATION", "10"))
MAX_CONCURRENT_SKILLS = 4
SKILL_TASK_TIMEOUT_SECONDS = 75
ALL_SKILLS_FAILED_MESSAGE = "Question generation failed for all skills. Please try again."

# =====================================

# Upload Groq models

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

# Make LLM model 

llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model=GROQ_MODEL,
    temperature=0.4,
    timeout=30,
    max_retries=1,
)

# Upload Tavily api key 

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

tavily_search = TavilySearch(
    tavily_api_key=TAVILY_API_KEY,
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
    question_text: str = Field(description="The interview question")
    difficulty_level: str = Field(description="beginner | intermediate | technical | deep")
    answer_hint: str = Field(description="1-2 short sentences on what a strong answer should cover")


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
  ],
  - For each question include "answer_hint": one or two short sentences on what a strong answer should cover (key points only, not the full answer).
    ...
    {{"question_text": "...", "difficulty_level": "...", "answer_hint": "..."}}
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


    if not isinstance(results, dict):
        return ""

    context_part = []
    for r in results.get("results", []):
        if not isinstance(r, dict):
            continue
        content = r.get("content", "")
        if content:
            context_part.append(content[:500])

    return "\n\n".join(context_part)



# ==========================
# Agent NODE FOR LANGGRAPH CALL
# ==============================

def _prepare_skills(skills : List[str]) -> List[str]:
    """Deduplicate case-insensitively, preserve parsed order, then cap."""
    unique_skills = []
    seen = set()

    for raw_skill in skills:
        skill = (raw_skill or "").strip()
        key = skill.casefold()

        if not skill or key in seen:
            continue

        seen.add(key)
        unique_skills.append(skill)

        if len(unique_skills) >= MAX_SKILLS_PER_GENERATION:
            break

    return unique_skills


def _generate_for_skill(skill : str, target_role : str, difficulty_level : str):
    search_context = question_by_tavily(skill, target_role)

    return generated_question_by_llm.invoke({
        "search_context" : search_context,
        "skill" : skill,
        "target_role" : target_role,
        "difficulty_level" : difficulty_level,
    })


def question_generator_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    if state.get("error"):
        return state

    skills = state.get("skills")
    target_role = state.get("target_role")

    if not skills:
        state["error"] = "Skills not Found"
        return state

    processed_skills = _prepare_skills(skills)
    print(f"skills received={len(skills)}, processing={len(processed_skills)}")

    if not processed_skills:
        state["question_sets"] = []
        state["error"] = "Skills not Found"
        return state

    difficulty_level = state.get("difficulty_level", "intermediate")
    results = [None] * len(processed_skills)
    succeeded = 0
    failed = 0

    executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_SKILLS)
    futures = [
        executor.submit(_generate_for_skill, skill, target_role, difficulty_level)
        for skill in processed_skills
    ]

    try:
        for index, future in enumerate(futures):
            try:
                result = future.result(timeout=SKILL_TASK_TIMEOUT_SECONDS)
            except Exception:
                failed += 1
                continue

            if result is None:
                failed += 1
                continue

            results[index] = result
            succeeded += 1
    finally:
        executor.shutdown(wait=False, cancel_futures=True)

    state["question_sets"] = [result for result in results if result is not None]
    print(
        f"skills processed={len(processed_skills)}, "
        f"succeeded={succeeded}, failed={failed}"
    )

    if failed == len(processed_skills):
        state["error"] = ALL_SKILLS_FAILED_MESSAGE
    else:
        state["error"] = None

    return state




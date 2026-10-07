from dotenv import load_dotenv
import os 
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List
from app.agent.state import Agent_Pipeline

load_dotenv()

# Import Env variable to make llm 

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

Evaluation_llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model=GROQ_MODEL,
    temperature=0.1
)

# Making Variables to obtain answer from LLM 

class RubricScore(BaseModel):
    correctness : int = Field(description="0-10: technical accuracy of the answer")
    depth : int = Field(description="0-10: how deeply the concept was explained, not just surface level")
    clarity : int = Field(description="0-10: how clearly and coherently the answer")

class EvaluationAnswer(BaseModel):
    rubric : RubricScore
    overall_score : float = Field(description="Average of the 3 rubric score")
    strengths : List[str] = Field(description="Specific things the candidate did well in this answer")
    weaknesses : List[str] = Field(description="Specific mistake or gap in this answer")
    verdict : str = Field(description="one of : weak | adequate | strong")


parser = JsonOutputParser(pydantic_object=EvaluationAnswer)


# Prompt template Rubric based on open ended Judgement

Evaluation_Prompt = ChatPromptTemplate.from_messages([
    ("system", """You are evaluating a candidate's answer in a {interview_type} interview 
for a {target_role} role, at {difficulty_level} difficulty.

Score the answer using this exact rubric, each on a 0-10 scale:
- correctness: Is the technical content accurate? Are there factual errors?
- depth: Did the candidate explain the underlying concept, or just name-drop terms?
- clarity: Was the answer well-structured and easy to follow?

Then provide:
- overall_score: the average of the three rubric scores
- strengths: 1-3 specific, concrete things done well (not generic praise)
- weaknesses: 1-3 specific, concrete gaps (not generic criticism)
- verdict: "weak" (overall_score < 4), "adequate" (4-7), or "strong" (> 7)

Be strict and specific. Do not inflate scores to be encouraging — this feedback 
needs to be honest so the candidate can actually improve.

Respond with ONLY valid JSON matching this structure:
{{
  "rubric": {{"correctness": 0, "depth": 0, "clarity": 0}},
  "overall_score": 0.0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "verdict": "weak" | "adequate" | "strong"
}}"""),
    ("human", """Question asked: {question_text}

Candidate's answer: {cleaned_transcript}"""),
])

# LCEL CHAIN Creater

evaluation_answer = Evaluation_Prompt | Evaluation_llm | parser

# MAIN NODE AGENT THAT WILL CALL BY LANGGRAPH

def evaluation_answer_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    if state.get("error"):
        return state

    if state.get("is_repeat_request"):
        return state

    cleaned_transcript = state.get("clean_answer_transcript","")
    question_text = state.get("current_question")

    if not cleaned_transcript.strip():

        state["current_evaluation"] = {
            "rubric" : {"correctness":0, "depth":0, "clarity":0},
            "overall_score": 0.0,
            "strengths" : [],
            "weaknesses": ["No answer was given in the Time Limit "],
            "verdict" : "weak"
        }

        return state

    try:
        result = evaluation_answer.invoke({
            "interview_type": state.get("role_source"),
            "target_role": state.get("target_role"),
            "difficulty_level": state.get("difficulty_level", "intermediate"),
            "question_text": question_text,
            "cleaned_transcript": cleaned_transcript
        })

    except Exception as e:
        state["error"] = f"Answer Evaluation Failed : {e}"
        return state

    state["current_evaluation"] = result

    evaluation_so_far = state.get("all_evaluation",[])
    evaluation_so_far.append(result)
    state["all_evaluation"] = evaluation_so_far

    return state



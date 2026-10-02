from dotenv import load_dotenv
import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from app.agent.state import Agent_Pipeline
from pydantic import BaseModel, Field


load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

# Make llm to parse question 
classifier_llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model=GROQ_MODEL
)


# Make a output format for llm 

class RepeatIntentQuestion(BaseModel):
    is_repeat_request : str = Field(description="True if the user is asking to repeat/re-hear the question, False if this is an actual answer attempt")
    confidence : str = Field(
        description="low | medium | high  How confidence the classification is"
    )

parser = JsonOutputParser(pydantic_object=RepeatIntentQuestion)

# Make system prompt for LCEL Chain 
REPEAT_INTENT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You classify a candidate's spoken response during a live interview.

Determine whether the response is:
- A REQUEST TO REPEAT the question (e.g. "can you repeat that", "sorry what was the question", 
  "say that again", "I didn't catch that")
- An ACTUAL ANSWER attempt, even if short, incomplete, uncertain, or includes 
  phrases like "I'm not sure, but..." — those are still answers, not repeat requests.

Be careful: a nervous pause filled with "um... let me think" is still an answer attempt, 
NOT a repeat request. Only classify as a repeat request if the user explicitly asks to 
hear the question again.

Respond with ONLY valid JSON:
{{
  "is_repeat_request": true | false,
  "confidence": "low" | "medium" | "high"
}}"""),
    ("human", "Candidate's response: {cleaned_transcript}"),
])

# LCEL CHAIN FOR LLM ANSWER

answer_intent = REPEAT_INTENT_PROMPT | classifier_llm | parser

# ======================================================
# MAIN NODE AGENT

def repeat_classifier_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    error = state.get("error")
    if error :
        return state

    cleaned_transcript = state.get("clean_answer_transcript","")

    if cleaned_transcript.strip():

        state["is_repeat_request"] = False

        return state

    try:
        result = answer_intent.invoke({"cleaned_transcript" : cleaned_transcript})

    except Exception:
        state["is_repeat_request"] = False
        return state

    is_repeat = result.get("is_repeat_request", False)

    if is_repeat:
        current_repeat_count = state.get("repeat_count_current_question", 0)

        if current_repeat_count >= 2:
            
            state["is_repeat_request"] = False
            state["repeat_limit_reached"] = True
        else:
            state["is_repeat_request"] = True
            state["repeat_count_current_question"] = current_repeat_count + 1
            state["repeat_limit_reached"] = False
    else:
        state["is_repeat_request"] = False
        state["repeat_limit_reached"] = False

    return state


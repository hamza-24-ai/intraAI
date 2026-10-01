from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os 
from langchain_core.output_parsers import StrOutputParser
from app.agent.state import Agent_Pipeline

load_dotenv()

# Import Groq models 
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

# Making LLM invoke model

cleanUp_llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model = GROQ_MODEL
)



# =====================
# Prompt Template for Groq to clean User raw transcript into 

STT_CLEANUP_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You clean up raw speech-to-text transcriptions from a live interview.

Rules:
- Remove filler words (um, uh, like, you know) ONLY when they add no meaning.
- Add correct punctuation and capitalization.
- Fix obvious transcription errors (e.g. misheard technical terms) ONLY if the 
  intended word is unambiguous from context.
- Do NOT change the meaning, add information, or rephrase the user's actual answer.
- Do NOT summarize — preserve the full content, just clean it.
- If the input is empty, nonsensical, or just silence/noise artifacts, return it unchanged.

Return ONLY the cleaned text, nothing else — no explanations, no quotes around it."""),
    ("human", "{raw_transcript}"),
])


# Making LCEL Chain to generate Answer
clean_answer = STT_CLEANUP_PROMPT | cleanUp_llm | StrOutputParser()


# Making main node to call by LangGraph

def sttp_cleanup_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    if state.get("error"):
        return state

    raw_transcript = state.get("raw_answer_transcript","")

    if not raw_transcript:
        state["clean_answer_transcript"] = "" 
        return state

    try:
        clean_answer = cleanUp_llm.invoke({"raw_transcript" : raw_transcript})
    except Exception:
        state["clean_answer_transcript"] = raw_transcript
        return state

    state["clean_answer_transcript"] = clean_answer.stript()

    return state
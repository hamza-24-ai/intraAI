# app/agents/tts_preprocessor.py
import os
import re

from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

tts_prep_llm = ChatGroq(
    model=GROQ_MODEL,
    temperature=0.0,
    api_key=GROQ_API_KEY
)

_PRONUNCIATIONS = [
    (r"C\+\+", "C plus plus"),
    (r"C#", "C sharp"),
    (r"\.NET", "dot net"),
    (r"\b(Node|React|Vue|Next|Express)\.js\b", r"\1 J S"),
    (r"\bJWT\b", "J W T"),
    (r"\bAPIs\b", "A P Is"),
    (r"\bAPI\b", "A P I"),
    (r"\bSQL\b", "S Q L"),
    (r"\bHTML\b", "H T M L"),
    (r"\bCSS\b", "C S S"),
    (r"\bOOP\b", "O O P"),
    (r"\bORM\b", "O R M"),
    (r"\bAWS\b", "A W S"),
    (r"\bUI\b", "U I"),
]

# code-ish characters that a TTS voice would read badly
_NEEDS_REWRITE = re.compile(r"[`{}\[\]<>=/\\*#|_~^]")

TTS_PREP_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You prepare interview questions to be read aloud by a text-to-speech voice.

Rewrite the text so it sounds natural when spoken by a human interviewer:
- Remove markdown, backticks, bullets and symbols. Describe any code or symbols in plain words.
- Use short sentences and commas for natural pauses.
- Keep the technical meaning exactly the same. Do not add, answer, or explain anything.

Return ONLY the text to be spoken."""),
    ("human", "{text}"),
])

tts_prep_chain = TTS_PREP_PROMPT | tts_prep_llm | StrOutputParser()


def prepare_for_speech(text: str) -> str:
    spoken = text
    for pattern, replacement in _PRONUNCIATIONS:
        spoken = re.sub(pattern, replacement, spoken)

    if not _NEEDS_REWRITE.search(spoken):
        return spoken

    try:
        return tts_prep_chain.invoke({"text": spoken}).strip() or spoken
    except Exception:
        return spoken  # fallback: deterministic version is still speakable
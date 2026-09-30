import os
import json
from app.agent.state import Agent_Pipeline
from dotenv import load_dotenv
from langchain_groq import ChatGroq
import requests
from langchain_community.document_loaders import PyPDFLoader,Docx2txtLoader
from io import BytesIO
import tempfile
from langchain_core.prompts import ChatPromptTemplate

# Allow to get data from env file 
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model = GROQ_MODEL
)


SYSTEM_PROMPT = """You are a resume parsing agent for a technical interview preparation platform.

Given raw resume text, extract:
1. skills — a list of technical skills (languages, frameworks, tools). Normalize casing (e.g. "React.js" not "react js").
2. target_role — the role this person is applying for. Look for a headline/title near the top of the resume (e.g. "Full Stack Developer", "Frontend Engineer"). If no clear headline exists, infer the most likely role from the dominant skill pattern. If you cannot confidently determine either, set target_role to null.
3. role_source — must be exactly one of: "headline", "inferred_from_skills", or "unknown".
4. experience_level — one of: "student", "fresh_grad", "junior", "mid", "senior".
5. projects — short titles of any projects mentioned.

Respond with ONLY a valid JSON object, no other text:
{
  "skills": ["skill1", "skill2"],
  "target_role": "role or null",
  "role_source": "headline" | "inferred_from_skills" | "unknown",
  "experience_level": "student" | "fresh_grad" | "junior" | "mid" | "senior",
  "projects": ["project1", "project2"]
}"""


# =====================================================
# Chat Prompt template 
# =====================================================

response_data = ChatPromptTemplate.from_messages([
    ("system" , SYSTEM_PROMPT),
    ("user", "Resume text : \n\n{raw_text}")
])

resume_chain = response_data | llm

# =======================================================================
# Download File from Cloudinary Into temporary memory 

def download_file_temp(file_url : str, file_type : str) -> str:

    response = requests.get(file_url, timeout=15)
    response.raise_for_status()

    suffix = f".{file_type}"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_file.write(response.content)
        return tmp_file.name



# ===================================================================
#  EXTRACT RAW TEXT USING LANGCHAIN LOADERS

def extract_text_with_langchain(file_path : str, file_type : str) -> str:
    if file_type == "pdf":
        loader = PyPDFLoader(file_path)
    elif file_type == "docx":
        loader = Docx2txtLoader(file_path)
    else:
        raise ValueError(f"Unsupported File type {file_type}")

    document = loader.load()

    raw_text = "\n".join(doc.page_content for doc in document)

    return raw_text

# ===================================
# CleanUp Temporary file 

def cleanup_temp_file(filepath : str):
    try:
        os.remove(filepath)
    except:
        OSError


# ====================================
# Resume Parser LLM 

def call_resume_parser_llm(raw_text : str) -> dict:
    # chain ko invoke krna 
    response = resume_chain.invoke({"raw_text" : raw_text})

    # Getting output from response 
    output = response.content.strip()

    # Output ko clean krna json ma taake dictionary ki form ma jaee 
    if output.startswith("```"):
        output = output.strip("`")
        if output.startswith("json"):
            output = output[4:].strip()


    return json.loads(output)


# ===================================================
# MAIN AGENT NODE IN LANGRAPH 

def resume_parser_agent(state : Agent_Pipeline) -> Agent_Pipeline:

    if not state.get("is_valid_file"):
        state["error"] = "Invalid File Cannot parsed"
        return state

    file_url = state["file_path"]
    file_type = state["file_type"]

    temp_path = None
    raw_text = ""

    try:
        temp_path = download_file_temp(file_url,file_type)
        raw_text = extract_text_with_langchain(temp_path,file_type)
    except requests.RequestException as e:
        state["error"] = f"Failed to download file : {str(e)}"
        return state
    except Exception as e:
        state["error"] = f"Failed to extract text : {str(e)}"
        return state
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)

    # data ko llm ko parse krna 
    try:
        parsed = call_resume_parser_llm(raw_text)
    except json.JSONDecodeError:
        state["error"] = "Resume parsing fail couldn't understand"
        state["skills"] = []
        state["target_role"] = None
        state["role_source"] = "unknown"
        state["experience_level"] = "student"
        state["projects"] = []
        state["needs_manual_role_input"] = True
        return state
    except Exception as e:
        state["error"] = f"Resume parsing fail : {str(e)}"
        return state

    # State ma data bhejna jo parsed ko mila hai 

    state["skills"] = parsed.get("skills", [])
    state["target_role"] = parsed.get("target_role")
    state["projects"] = parsed.get("projects", [])
    state["role_source"] = parsed.get("role_source", "unknown")
    state["experience_level"] = parsed.get("experience_level", "student")
    state["error"] = None

    state["needs_manual_role_input"] = False

    return state
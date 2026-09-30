import os 
from urllib.parse import urlparse
from app.agent.state import Agent_Pipeline

ALLOWED_EXTENSIONS = {".pdf", ".docx"}

def extracter_file_data(state : Agent_Pipeline) -> Agent_Pipeline:

    """
        Checking through URL Whether the URL is pdf or docx 
    """

    file_url = state["file_path"]
    url = urlparse(file_url)
    clean_url = url.path(url)
    _,ext = os.path.splitext(clean_url)
    ext = ext.lower()

    if ext not in ALLOWED_EXTENSIONS:
        state["file_type"] = None
        state["is_valid_file"] = False
        state["error"] = f"Uploaded file is UnSupported {ext} , Only PDF & DOCX are allowed"

        return state

    state["file_type"] = ext.replace(".","")
    state["is_valid_file"] = True
    state["error"] = None

    return state
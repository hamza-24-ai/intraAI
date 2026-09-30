from typing import Optional,List,TypedDict


class Agent_Pipeline(TypedDict):

    user_id : Optional[int] = None
    file_path : Optional[str] = None
    file_type : Optional[str] = None
    raw_text : str

    skills : List[str]
    target_role : str
    role_source : str
    experience_level : str
    projects : List[str]
    error : Optional[str] = None
    is_valid_file : bool

    needs_manual_role_input : bool


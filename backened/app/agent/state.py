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
    question_sets : List[dict]
    raw_answer_transcript : str
    clean_answer_transcript : str

    # repeat classifier agent
    is_repeat_request : bool
    reach_count_current_question : int
    reach_limit : bool

    # Answer Evaluation Agent
    current_question : str
    current_evaluation : dict
    all_evaluation : List[dict]
    next_action : str
    # Live Interview per turn
    interveiw_type : str
    difficulty_level : str
    current_skill : str
    was_skipped : bool
    last_speech_end_transcript : Optional[float]

    # Final Report
    final_feedback_report : dict

    # Ended Interview checker 
    is_interview_ended : bool

    # handling interview time 
    session_start_timestamp: Optional[float]  
    duration_minutes: int                      
    questions_asked_count: int                  
    interview_ended: bool
    end_reason: Optional[str] 

    needs_manual_role_input : bool

    # new endpoints 

    skill_index : Optional[int] = 0
    asked_questions : Optional[List[str]] = []


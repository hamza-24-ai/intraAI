import os
from dotenv import load_dotenv
from supabase import create_client,Client

load_dotenv()

SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")


supabase : Client = create_client(SUPABASE_URL,SUPABASE_KEY)

# Quick sanity check — run this once to confirm connection works
if __name__ == "__main__":
    print(supabase.auth.get_session())  # should not throw an error
    print("Supabase connected Successfully")
    
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os 
import uuid

load_dotenv()

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")


cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)


def upload_transcript(file_bytes: bytes, filename: str):

    ext = os.path.splitext(filename,"")[1].lower()
    public_id = f"intraAI{uuid.uuid4().hex}{ext}"

    result = cloudinary.uploader.upload(
        file_bytes,
        resource_type="raw",
        public_id=public_id
    )
    return result["secure_url"], result["public_id"]


def delete_transcript(public_id: str):
    cloudinary.uploader.destroy(public_id, resource_type="raw")
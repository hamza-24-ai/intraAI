# app/services/stt.py
import asyncio
import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

STT_MODEL = "whisper-large-v3-turbo"
MIN_AUDIO_SECONDS = 0.4
# Whisper sometimes "hears" these in near-silence
_HALLUCINATIONS = {"you", "thank you", "thank you.", "thanks for watching.", "thanks for watching!"}


class STTError(Exception):
    pass


def _guess_filename(audio_bytes: bytes) -> str:
    if audio_bytes[:4] == b"RIFF":
        return "answer.wav"
    if audio_bytes[:3] == b"ID3" or audio_bytes[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
        return "answer.mp3"
    return "answer.webm"


def _transcribe_sync(audio_bytes: bytes, vocab_hint: str) -> str:
    kwargs = {"language": "en", "temperature": 0.0}  # fixed language: avoids accent-based misdetection
    if vocab_hint:
        kwargs["prompt"] = vocab_hint  # biases Whisper toward the candidate's tech terms
    result = _client.audio.transcriptions.create(
        file=(_guess_filename(audio_bytes), audio_bytes),
        model=STT_MODEL,
        **kwargs,
    )
    return result.text.strip()


async def transcribe_audio(audio_bytes: bytes, vocab_hint: str = "") -> str:
    # 16 kHz mono 16-bit WAV = 32,000 bytes/s
    if audio_bytes[:4] == b"RIFF" and (len(audio_bytes) - 44) / 32000 < MIN_AUDIO_SECONDS:
        return ""
    try:
        text = await asyncio.to_thread(_transcribe_sync, audio_bytes, vocab_hint)
    except Exception as e:
        raise STTError(str(e))
    return "" if text.lower() in _HALLUCINATIONS else text
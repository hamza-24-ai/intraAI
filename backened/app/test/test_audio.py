# test_audio.py  (backend root: python -m app.test.test_audio)
import asyncio
import logging
from dotenv import load_dotenv

load_dotenv()

from app.services.tts import synthesize_speech  # noqa: E402
from app.services.stt import transcribe_audio  # noqa: E402

import os
from dotenv import load_dotenv
load_dotenv()
print("Key loaded:", bool(os.getenv("ELEVENLABS_API_KEY")))

from app.services.tts import _synth_sync
try:
    print("OK, bytes:", len(_synth_sync("Hello, this is a test.")))
except Exception as e:
    print(type(e).__name__, e)


async def main():
    logging.basicConfig(level=logging.INFO)
    audio = await synthesize_speech("Can you explain how React's virtual DOM works?")
    print("TTS bytes:", None if audio is None else len(audio))
    if audio is None:
        raise SystemExit("TTS failed: check logs")
    print("STT:", await transcribe_audio(audio, "React, virtual DOM"))

asyncio.run(main())
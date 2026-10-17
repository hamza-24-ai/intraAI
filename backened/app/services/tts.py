# app/services/tts.py
import asyncio
import hashlib
import logging
import io
from collections import OrderedDict
from typing import Optional
from gtts import gTTS

logger = logging.getLogger(__name__)

_CACHE: "OrderedDict[str, bytes]" = OrderedDict()
_CACHE_MAX = 200

def _synth_sync(text: str) -> bytes:
    # gTTS ka object bana kar audio bytes mein convert karna
    tts = gTTS(text=text, lang='en', slow=False)
    fp = io.BytesIO()
    tts.write_to_fp(fp)
    fp.seek(0)
    return fp.read()

async def synthesize_speech(text: str) -> Optional[bytes]:
    """MP3 bytes using gTTS, with caching support."""
    key = hashlib.sha1(f"gtts|{text}".encode()).hexdigest()

    if key in _CACHE:
        _CACHE.move_to_end(key)
        return _CACHE[key]

    try:
        audio = await asyncio.to_thread(_synth_sync, text)
    except Exception as e:
        logger.error("gTTS synthesis failed: %r", e)
        return None

    _CACHE[key] = audio
    if len(_CACHE) > _CACHE_MAX:
        _CACHE.popitem(last=False)
        
    return audio
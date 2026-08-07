import logging
import re
import uuid

import edge_tts
import httpx

from ...core.settings import settings

log = logging.getLogger(__name__)

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
OUTPUT_FORMAT = "mp3_44100_128"

# ElevenLabs returns errors in a "detail" body; map HTTP status to a helpful message.
ELEVENLABS_STATUS_HINTS = {
    401: "Invalid ElevenLabs API key. Double-check ELEVENLABS_API_KEY in backend/.env.",
    402: "Out of ElevenLabs credits. Add credits or lower the podcast duration to stay within budget.",
    403: "Your ElevenLabs plan does not allow this request (check plan model access for this endpoint).",
    422: "ElevenLabs rejected the request (text length or parameter validation). Shrink duration/speakers and retry.",
    429: "ElevenLabs rate limit hit. Wait a few seconds and try again.",
}


class ElevenLabsError(Exception):
    """Raised when an ElevenLabs request fails, with a user-facing message."""


async def synthesize_edge(text: str, voice: str, output_path: str) -> str:
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    return output_path


async def synthesize_openai(text: str, voice: str, output_path: str) -> str:
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.OPENAI_TTS_MODEL,
        "input": text,
        "voice": voice,
        "response_format": "mp3",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/speech",
            headers=headers,
            json=payload,
            timeout=120.0,
        )
        response.raise_for_status()
    with open(output_path, "wb") as f:
        f.write(response.content)
    return output_path


# ── ElevenLabs helpers ────────────────────────────────────────────────────────


def _elevenlabs_headers() -> dict:
    return {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }


def _raise_for_elevenlabs(response: httpx.Response) -> None:
    if response.is_success:
        return
    hint = ELEVENLABS_STATUS_HINTS.get(response.status_code, "ElevenLabs API error.")
    try:
        detail = response.json().get("detail") or response.text[:300]
    except Exception:
        detail = response.text[:300]
    raise ElevenLabsError(f"{hint} (HTTP {response.status_code}: {detail})")


def _split_text(text: str, max_chars: int) -> list[str]:
    """Split long text on sentence boundaries so each chunk fits max_chars."""
    text = text.strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    # Split only on sentence endings so "Dr. Smith" and "3.5" stay intact.
    sentences = re.split(r"(?<=[.!?])\s+", text)
    current = ""
    for sentence in sentences:
        if len(sentence) > max_chars:
            if current:
                chunks.append(current)
                current = ""
            for i in range(0, len(sentence), max_chars):
                chunks.append(sentence[i : i + max_chars])
            continue
        if current and len(current) + len(sentence) + 1 > max_chars:
            chunks.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip() if current else sentence
    if current:
        chunks.append(current)
    return chunks


async def _stitch_mp3_parts(parts: list[bytes], output_path: str) -> str:
    """Concatenate same-format MP3 parts (mp3_44100_128 is CBR, safe to splice)."""
    with open(output_path, "wb") as f:
        for part in parts:
            f.write(part)
    return output_path


async def synthesize_elevenlabs(text: str, voice_id: str, output_path: str) -> str:
    """Single-voice ElevenLabs synthesis with sentence-aware chunking."""
    headers = _elevenlabs_headers()
    chunks = _split_text(text, settings.ELEVENLABS_MAX_CHARS_PER_REQUEST)

    if not chunks:
        with open(output_path, "wb") as f:
            f.write(b"")
        return output_path

    parts: list[bytes] = []
    async with httpx.AsyncClient() as client:
        for i, chunk in enumerate(chunks):
            payload = {
                "text": chunk,
                "model_id": settings.ELEVENLABS_TTS_MODEL,
                "language_code": settings.ELEVENLABS_LANGUAGE_CODE,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.85,
                    "style": 0.0,
                },
            }
            # Voice continuity hints between consecutive chunks.
            if i > 0:
                payload["previous_text"] = chunks[i - 1][-500:]
            if i + 1 < len(chunks):
                payload["next_text"] = chunks[i + 1][:500]

            response = await client.post(
                f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}",
                headers=headers,
                params={"output_format": OUTPUT_FORMAT},
                json=payload,
                timeout=180.0,
            )
            _raise_for_elevenlabs(response)
            parts.append(response.content)
            log.info(f"ElevenLabs TTS chunk {i + 1}/{len(chunks)} done ({len(chunk)} chars)")

    return await _stitch_mp3_parts(parts, output_path)


async def synthesize_elevenlabs_dialogue(inputs: list[dict], output_path: str) -> str:
    """Multi-speaker ElevenLabs dialogue synthesis.

    inputs: list of {"voice_id": str, "text": str} turns in speaking order.
    Kept under the per-request character budget, results stitched into one mp3.
    """
    if not inputs:
        raise ElevenLabsError("No dialogue turns were provided for synthesis.")

    headers = _elevenlabs_headers()
    budget = settings.ELEVENLABS_DIALOGUE_CHARS_PER_REQUEST

    # Split the turn stream into requests that each fit the character budget.
    requests: list[list[dict]] = []
    current: list[dict] = []
    current_len = 0
    for turn in inputs:
        text = (turn.get("text") or "").strip()
        if not text:
            continue
        entry = {"voice_id": turn["voice_id"], "text": text}
        if current and current_len + len(text) > budget:
            requests.append(current)
            current = [entry]
            current_len = len(text)
        else:
            current.append(entry)
            current_len += len(text)
    if current:
        requests.append(current)

    parts: list[bytes] = []
    async with httpx.AsyncClient() as client:
        for i, batch in enumerate(requests):
            payload = {
                "inputs": batch,
                "model_id": settings.ELEVENLABS_DIALOGUE_MODEL,
                "language_code": settings.ELEVENLABS_LANGUAGE_CODE,
            }
            batch_chars = sum(len(t["text"]) for t in batch)
            log.info(
                f"ElevenLabs dialogue batch {i + 1}/{len(requests)} "
                f"({len(batch)} turns, {batch_chars} chars)"
            )
            response = await client.post(
                f"{ELEVENLABS_BASE_URL}/text-to-dialogue",
                headers=headers,
                params={"output_format": OUTPUT_FORMAT},
                json=payload,
                timeout=240.0,
            )
            _raise_for_elevenlabs(response)
            parts.append(response.content)

    return await _stitch_mp3_parts(parts, output_path)


PROVIDERS = {
    "edge": synthesize_edge,
    "openai": synthesize_openai,
    "elevenlabs": synthesize_elevenlabs,
}


def get_available_voices() -> list[dict]:
    """Return list of available voices based on enabled providers."""
    enabled = settings.enabled_tts_providers
    voices = []
    for v in settings.parsed_voices:
        if v["provider"] in enabled:
            voices.append(v)
    # Fallback: if no voices match, return all configured
    if not voices:
        voices = settings.parsed_voices
    return voices


def estimate_characters(script_data: dict) -> int:
    """Estimate total characters that TTS would consume for a script."""
    total = 0
    for seg in script_data.get("segments", []):
        total += len(str(seg.get("text", "")).strip())
    total += len(str(script_data.get("intro", "")).strip())
    total += len(str(script_data.get("outro", "")).strip())
    return total


def _build_dialogue_inputs(script_data: dict, voice: str | None) -> list[dict]:
    """Map each script speaker to a voice and build the dialogue input list."""
    segments = script_data.get("segments")
    if not segments:
        return []

    speakers = script_data.get("speakers", [])

    # Choose voices, honoring a user-picked voice first.
    voices = settings.elevenlabs_voices
    if voice:
        base = [{"provider": "elevenlabs", "voice_id": voice, "name": "selected"}]
        base += [dv for dv in voices if dv["voice_id"] != voice]
        voices = base
    if not voices:
        voices = [{"provider": "elevenlabs", "voice_id": settings.ELEVENLABS_VOICE_ID, "name": "default"}]

    # Assign a voice per speaker (by declaration order), rotating if needed.
    speaker_voice: dict[str, str] = {}
    for idx, spk in enumerate(speakers):
        name = spk.get("name")
        if name:
            speaker_voice[name] = voices[idx % len(voices)]["voice_id"]

    dialogue: list[dict] = []
    first_voice = voices[0]["voice_id"]

    def push_turn(name: str | None, text: str | None) -> None:
        text = (text or "").strip()
        if not text:
            return
        voice_id = speaker_voice.get(name or "", first_voice)
        dialogue.append({"voice_id": voice_id, "text": text})

    push_turn(None, script_data.get("intro"))
    for seg in segments:
        push_turn(seg.get("speaker"), seg.get("text"))
    push_turn(None, script_data.get("outro"))

    return dialogue


async def synthesize(
    text: str,
    output_filename: str | None = None,
    voice: str | None = None,
    provider: str | None = None,
    script_data: dict | None = None,
) -> str:
    """Synthesize text to speech using the configured provider.

    When provider is elevenlabs and script_data carries speaker segments, this
    uses the Text to Dialogue API so each speaker gets the assigned voice.
    """
    if not output_filename:
        output_filename = f"tts_{uuid.uuid4().hex[:12]}.mp3"

    output_path = str(settings.audio_storage_dir / output_filename)

    prov = provider or settings.TTS_PROVIDER
    enabled = settings.enabled_tts_providers
    if prov not in enabled:
        prov = enabled[0] if enabled else "edge"

    if prov == "elevenlabs" and not settings.ELEVENLABS_API_KEY:
        from fastapi import HTTPException, status as http_status

        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ElevenLabs is selected but ELEVENLABS_API_KEY is not set in backend/.env.",
        )

    # ElevenLabs multi-speaker path (best podcast quality).
    if prov == "elevenlabs" and script_data:
        dialogue = _build_dialogue_inputs(script_data, voice)
        if dialogue:
            log.info(f"TTS: provider=elevenlabs, dialogue_path=True, turns={len(dialogue)}")
            try:
                return await synthesize_elevenlabs_dialogue(dialogue, output_path)
            except ElevenLabsError:
                raise
            except Exception as e:
                log.warning(
                    f"Text to Dialogue synthesis failed ({e}); falling back to single-voice TTS."
                )

    # Determine voice
    v = voice or settings.EDGE_TTS_VOICE
    if prov == "openai":
        v = voice or settings.OPENAI_TTS_VOICE
    elif prov == "elevenlabs":
        v = voice or settings.ELEVENLABS_VOICE_ID

    if prov == "elevenlabs":
        log.info(f"TTS: provider=elevenlabs, voice={v}, text_len={len(text)}")
        return await synthesize_elevenlabs(text, v, output_path)

    synth_fn = PROVIDERS.get(prov, synthesize_edge)
    log.info(f"TTS: provider={prov}, voice={v}, text_len={len(text)}")
    await synth_fn(text, v, output_path)
    return output_path

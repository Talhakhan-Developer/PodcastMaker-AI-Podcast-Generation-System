from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "PodcastMaker"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "podcastmaker"
    POSTGRES_PASSWORD: str = "change-me"
    POSTGRES_DB: str = "podcastmaker"

    # Groq (LLM)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # TTS Provider
    TTS_PROVIDER: str = "edge"

    # Edge TTS
    EDGE_TTS_ENABLED: str = "1"
    EDGE_TTS_VOICE: str = "en-US-GuyNeural"

    # OpenAI TTS
    OPENAI_TTS_ENABLED: str = "0"
    OPENAI_API_KEY: str = ""
    OPENAI_TTS_MODEL: str = "tts-1"
    OPENAI_TTS_VOICE: str = "nova"

    # ElevenLabs TTS
    ELEVENLABS_TTS_ENABLED: str = "0"
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    # Character-efficient model for single-voice synthesis (50% cheaper than v3)
    ELEVENLABS_TTS_MODEL: str = "eleven_flash_v2_5"
    # Model used for the multi-speaker Text to Dialogue API
    ELEVENLABS_DIALOGUE_MODEL: str = "eleven_v3"
    # Language code (ISO 639-1) passed to ElevenLabs for text normalization
    ELEVENLABS_LANGUAGE_CODE: str = "en"
    # Hard cap on characters sent per podcast episode (credit guard). ElevenLabs
    # free plans grant ~10k credits, and credits map ~1:1 to characters.
    ELEVENLABS_MAX_CHARS: int = 8000
    # Max characters per single API request (ElevenLabs free plan allows 2.5k).
    # Long single-voice scripts are split on sentence boundaries into requests
    # of at most this many characters, then stitched back into one file.
    ELEVENLABS_MAX_CHARS_PER_REQUEST: int = 2500
    # Recommended per-request budget for the dialogue API (scaled by the same
    # per-request cap so multi-speaker segments share a maximum window).
    ELEVENLABS_DIALOGUE_CHARS_PER_REQUEST: int = 2000

# Available voices (comma-separated: provider:voice_id:name)
    AVAILABLE_VOICES: str = (
        "elevenlabs:JBFqnCBsd6RMkjVDRZzb:host,"
        "elevenlabs:EXAVITQu4vr4xnSDxMaL:guest,"
        "elevenlabs:Xb7hH8MSUJpSbSDYk0k2:narrator,"
        "elevenlabs:IKne3meq5aSn9XLyUdCD:deep,"
        "elevenlabs:TX3LPaxmHKxFdv7VOQHJ:energetic,"
        "elevenlabs:N2lVS1w4EtoT3dr4eOWO:british,"
        "edge:en-US-GuyNeural:host,"
        "edge:en-US-JennyNeural:guest,"
        "edge:en-US-AriaNeural:narrator,"
        "edge:en-US-DavisNeural:deep,"
        "edge:en-US-SaraNeural:energetic,"
        "edge:en-GB-RyanNeural:british"
    )

    # JWT
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    AUDIO_STORAGE_PATH: str = "./storage/audio"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def audio_storage_dir(self) -> Path:
        p = Path(self.AUDIO_STORAGE_PATH)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def enabled_tts_providers(self) -> list[str]:
        providers = []
        if self.EDGE_TTS_ENABLED == "1":
            providers.append("edge")
        if self.OPENAI_TTS_ENABLED == "1" and self.OPENAI_API_KEY:
            providers.append("openai")
        if self.ELEVENLABS_TTS_ENABLED == "1" and self.ELEVENLABS_API_KEY:
            providers.append("elevenlabs")
        return providers

    @property
    def elevenlabs_voices(self) -> list[dict]:
        """ElevenLabs voices declared in AVAILABLE_VOICES (in declared order)."""
        return [v for v in self.parsed_voices if v["provider"] == "elevenlabs"]

    @property
    def parsed_voices(self) -> list[dict]:
        voices = []
        for entry in self.AVAILABLE_VOICES.split(","):
            parts = entry.strip().split(":")
            if len(parts) >= 3:
                voices.append({
                    "provider": parts[0],
                    "voice_id": parts[1],
                    "name": parts[2],
                })
            elif len(parts) == 2:
                voices.append({
                    "provider": "edge",
                    "voice_id": parts[0],
                    "name": parts[1],
                })
        return voices

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

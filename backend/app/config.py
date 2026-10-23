from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str
    algorithm: str = "HS256"
    token_minutes: int = 600
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://172.18.208.1:5173",
    ]

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
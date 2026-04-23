from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_NUMBER: str = "+14155238886"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()

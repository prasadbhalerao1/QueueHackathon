from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Required secrets - made optional for startup stability
    MONGODB_URI: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_WHATSAPP_NUMBER: Optional[str] = None
    SECRET_KEY: Optional[str] = None
    
    # Configuration with sensible defaults
    GEMINI_MODEL: str = "gemini-2.5-flash"
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()

# Get allowed origins for CORS
def get_allowed_origins():
    """
    Returns allowed origins for CORS based on environment.
    """
    environment = os.getenv("ENVIRONMENT", "development")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    if environment == "production":
        # Start with URLs from environment
        urls = [url.strip().rstrip("/") for url in frontend_url.replace(";", ",").split(",") if url.strip()]
        # Add broad demo whitelists (Very Permissive for Hackathon)
        urls.extend([
            "https://queueos-frontend-552912088240.us-central1.run.app",
            "https://queue-system-demo.vercel.app",
            "https://queue-hackathon-eight.vercel.app",
            "https://*.vercel.app"
        ])
        return list(set(urls))
    else:
        # For development, allow everything
        return ["*"]

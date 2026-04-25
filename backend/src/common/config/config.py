from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Required secrets - must be provided in .env file
    MONGODB_URI: str
    GEMINI_API_KEY: str
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_NUMBER: str
    SECRET_KEY: str
    
    # Configuration with sensible defaults
    GEMINI_MODEL: str = "gemini-1.5-flash"
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()

# Get allowed origins for CORS
def get_allowed_origins():
    """
    Returns allowed origins for CORS based on environment.
    For Vercel deployment, allows the frontend URL from env.
    For development, allows localhost.
    """
    environment = os.getenv("ENVIRONMENT", "development")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    if environment == "production":
        # For production, allow specific frontend URLs (comma-separated if multiple)
        urls = [url.strip().rstrip("/") for url in frontend_url.replace(";", ",").split(",")]
        return urls
    else:
        # For development, allow localhost variations and the frontend URL
        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            frontend_url.rstrip("/"),
            # Allow Vercel preview deployments
            "https://*.vercel.app",
        ]

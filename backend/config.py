from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str = "moneymanagement"
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    
    # AI APIs (Optional)
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Application
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

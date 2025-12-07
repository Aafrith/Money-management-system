from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from models import UserCreate, UserLogin, Token, UserResponse, UserRole, UserStatus
from auth import get_password_hash, verify_password, create_access_token, serialize_user, get_current_active_user
from database import get_database
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db=Depends(get_database)):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_dict = {
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "role": user_data.role,
        "password": get_password_hash(user_data.password),
        "status": UserStatus.ACTIVE,
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
        "avatar": None
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Create default categories for the user
    default_categories = [
        {"name": "Food & Dining", "color": "#0ea5e9", "icon": "🍔"},
        {"name": "Transportation", "color": "#a855f7", "icon": "🚗"},
        {"name": "Shopping", "color": "#f59e0b", "icon": "🛍️"},
        {"name": "Entertainment", "color": "#10b981", "icon": "🎬"},
        {"name": "Bills & Utilities", "color": "#ef4444", "icon": "📄"},
        {"name": "Healthcare", "color": "#ec4899", "icon": "⚕️"},
        {"name": "Education", "color": "#8b5cf6", "icon": "📚"},
        {"name": "Travel", "color": "#06b6d4", "icon": "✈️"},
    ]
    
    for category in default_categories:
        await db.categories.insert_one({
            **category,
            "user_id": str(result.inserted_id),
            "created_at": datetime.utcnow(),
            "count": 0
        })
    
    # Generate token
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    
    # Return token and user info
    user_response = serialize_user(user_dict)
    del user_response["password"]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db=Depends(get_database)):
    """Login user"""
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is suspended
    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended"
        )
    
    # Update last active
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active": datetime.utcnow()}}
    )
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    # Return token and user info
    user_response = serialize_user(user)
    del user_response["password"]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    user_response = serialize_user(current_user)
    del user_response["password"]
    return user_response

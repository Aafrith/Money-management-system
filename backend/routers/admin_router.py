from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId
from models import (
    UserResponse, AdminUserStats, AdminDashboardStats, 
    AdminUpdateUser, AdminCreateUser, UserStatus, UserRole
)
from auth import get_current_admin_user, serialize_user, get_password_hash
from database import get_database

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_admin_dashboard(
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get admin dashboard statistics"""
    
    # Get all users
    all_users = await db.users.find({}).to_list(length=None)
    total_users = len(all_users)
    
    # Active users (logged in within last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = len([
        u for u in all_users 
        if u.get("last_active") and u["last_active"] > thirty_days_ago
    ])
    
    # Get all expenses
    all_expenses = await db.expenses.find({}).to_list(length=None)
    total_expenses = len(all_expenses)
    total_amount = sum(exp["amount"] for exp in all_expenses)
    
    # Calculate growth (compare with previous period)
    sixty_days_ago = datetime.utcnow() - timedelta(days=60)
    prev_users = len([
        u for u in all_users 
        if u.get("created_at") and sixty_days_ago <= u["created_at"] < thirty_days_ago
    ])
    current_users = len([
        u for u in all_users 
        if u.get("created_at") and u["created_at"] >= thirty_days_ago
    ])
    
    user_growth = 0.0
    if prev_users > 0:
        user_growth = ((current_users - prev_users) / prev_users) * 100
    elif current_users > 0:
        user_growth = 100.0
    
    # Expense growth
    prev_expenses = [
        exp for exp in all_expenses 
        if sixty_days_ago <= exp["date"] < thirty_days_ago
    ]
    current_expenses = [
        exp for exp in all_expenses 
        if exp["date"] >= thirty_days_ago
    ]
    
    prev_amount = sum(exp["amount"] for exp in prev_expenses)
    current_amount = sum(exp["amount"] for exp in current_expenses)
    
    expense_growth = 0.0
    if prev_amount > 0:
        expense_growth = ((current_amount - prev_amount) / prev_amount) * 100
    elif current_amount > 0:
        expense_growth = 100.0
    
    return AdminDashboardStats(
        totalUsers=total_users,
        activeUsers=active_users,
        totalExpenses=total_expenses,
        totalAmount=round(total_amount, 2),
        userGrowth=round(user_growth, 2),
        expenseGrowth=round(expense_growth, 2)
    )

@router.get("/users", response_model=List[AdminUserStats])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = Query("all", regex="^(all|active|inactive|suspended)$"),
    search: str = None,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get all users with their statistics"""
    
    query = {}
    
    # Apply status filter
    if status_filter != "all":
        query["status"] = status_filter
    
    # Apply search
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    # Get users
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    # Get expense stats for each user
    user_stats = []
    for user in users:
        user_id = str(user["_id"])
        
        # Count expenses
        expense_count = await db.expenses.count_documents({"user_id": user_id})
        
        # Sum total amount
        expenses = await db.expenses.find({"user_id": user_id}).to_list(length=None)
        total_amount = sum(exp["amount"] for exp in expenses)
        
        user_stats.append(AdminUserStats(
            id=user_id,
            name=user["name"],
            email=user["email"],
            phone=user.get("phone"),
            status=user.get("status", UserStatus.ACTIVE),
            role=user.get("role", UserRole.USER),
            expenses=expense_count,
            totalAmount=round(total_amount, 2),
            joinDate=user["created_at"],
            lastActive=user.get("last_active"),
            avatar=user.get("avatar")
        ))
    
    return user_stats

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    user_data: AdminCreateUser,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Create a new user (admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "password": get_password_hash(user_data.password),
        "role": user_data.role,
        "status": user_data.status,
        "created_at": datetime.utcnow(),
        "last_active": None,
        "avatar": None,
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create default categories for the user
    default_categories = [
        {"name": "Food & Dining", "icon": "🍔", "color": "#FF6B6B", "user_id": user_id, "created_at": datetime.utcnow()},
        {"name": "Transportation", "icon": "🚗", "color": "#4ECDC4", "user_id": user_id, "created_at": datetime.utcnow()},
        {"name": "Shopping", "icon": "🛍️", "color": "#45B7D1", "user_id": user_id, "created_at": datetime.utcnow()},
        {"name": "Entertainment", "icon": "🎮", "color": "#96CEB4", "user_id": user_id, "created_at": datetime.utcnow()},
        {"name": "Healthcare", "icon": "🏥", "color": "#FFEAA7", "user_id": user_id, "created_at": datetime.utcnow()},
        {"name": "Bills & Utilities", "icon": "💡", "color": "#DFE6E9", "user_id": user_id, "created_at": datetime.utcnow()},
        {"name": "Other", "icon": "📌", "color": "#A29BFE", "user_id": user_id, "created_at": datetime.utcnow()},
    ]
    
    await db.categories.insert_many(default_categories)
    
    # Get created user
    created_user = await db.users.find_one({"_id": result.inserted_id})
    user_response = serialize_user(created_user)
    del user_response["password"]
    
    return user_response

@router.get("/users/{user_id}", response_model=AdminUserStats)
async def get_user_details(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get detailed information about a specific user"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get expense stats
    expense_count = await db.expenses.count_documents({"user_id": user_id})
    expenses = await db.expenses.find({"user_id": user_id}).to_list(length=None)
    total_amount = sum(exp["amount"] for exp in expenses)
    
    return AdminUserStats(
        id=user_id,
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        status=user.get("status", UserStatus.ACTIVE),
        role=user.get("role", UserRole.USER),
        expenses=expense_count,
        totalAmount=round(total_amount, 2),
        joinDate=user["created_at"],
        lastActive=user.get("last_active"),
        avatar=user.get("avatar")
    )

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: AdminUpdateUser,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Update user status or role (admin only)"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow admins to modify their own status
    if str(user["_id"]) == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own account"
        )
    
    # Update only provided fields
    update_fields = {k: v for k, v in update_data.dict(exclude_unset=True).items()}
    
    if update_fields:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    user_response = serialize_user(updated_user)
    del user_response["password"]
    
    return user_response

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Delete a user and all their data (admin only)"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow admins to delete themselves
    if str(user["_id"]) == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Delete user's expenses
    await db.expenses.delete_many({"user_id": user_id})
    
    # Delete user's categories
    await db.categories.delete_many({"user_id": user_id})
    
    # Delete user
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    return None

@router.get("/users/{user_id}/expenses")
async def get_user_expenses(
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get all expenses for a specific user (admin only)"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cursor = db.expenses.find({"user_id": user_id}).sort("date", -1).skip(skip).limit(limit)
    expenses = await cursor.to_list(length=limit)
    
    # Serialize expenses
    for expense in expenses:
        expense["_id"] = str(expense["_id"])
    
    return expenses

@router.get("/settings")
async def get_admin_settings(
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Get admin settings (admin only)"""
    
    # Try to get settings from database
    settings = await db.settings.find_one({"_id": "admin_settings"})
    
    if not settings:
        # Create default settings if they don't exist
        from models import AdminSettings
        default_settings = AdminSettings().dict()
        default_settings["_id"] = "admin_settings"
        default_settings["updated_at"] = datetime.utcnow()
        default_settings["updated_by"] = str(current_user["_id"])
        
        await db.settings.insert_one(default_settings)
        settings = default_settings
    
    # Remove MongoDB internal fields
    if "_id" in settings:
        del settings["_id"]
    if "updated_at" in settings:
        del settings["updated_at"]
    if "updated_by" in settings:
        del settings["updated_by"]
    
    return settings

@router.patch("/settings")
async def update_admin_settings(
    settings_update: dict,
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Update admin settings (admin only)"""
    
    # Get existing settings
    existing_settings = await db.settings.find_one({"_id": "admin_settings"})
    
    if not existing_settings:
        # Create new settings document
        from models import AdminSettings
        default_settings = AdminSettings().dict()
        existing_settings = default_settings
        existing_settings["_id"] = "admin_settings"
    
    # Update with new values
    update_data = {
        **settings_update,
        "updated_at": datetime.utcnow(),
        "updated_by": str(current_user["_id"])
    }
    
    # Update or insert
    await db.settings.update_one(
        {"_id": "admin_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    # Return updated settings
    updated_settings = await db.settings.find_one({"_id": "admin_settings"})
    
    # Remove MongoDB internal fields
    if "_id" in updated_settings:
        del updated_settings["_id"]
    if "updated_at" in updated_settings:
        del updated_settings["updated_at"]
    if "updated_by" in updated_settings:
        del updated_settings["updated_by"]
    
    return updated_settings

@router.post("/settings/reset")
async def reset_admin_settings(
    current_user: dict = Depends(get_current_admin_user),
    db = Depends(get_database)
):
    """Reset settings to defaults (admin only)"""
    
    from models import AdminSettings
    default_settings = AdminSettings().dict()
    default_settings["_id"] = "admin_settings"
    default_settings["updated_at"] = datetime.utcnow()
    default_settings["updated_by"] = str(current_user["_id"])
    
    await db.settings.update_one(
        {"_id": "admin_settings"},
        {"$set": default_settings},
        upsert=True
    )
    
    # Remove MongoDB internal fields for response
    del default_settings["_id"]
    del default_settings["updated_at"]
    del default_settings["updated_by"]
    
    return default_settings

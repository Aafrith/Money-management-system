from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from models import UserUpdate, UserChangePassword, UserResponse
from auth import get_current_active_user, get_password_hash, verify_password, serialize_user
from database import get_database

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get current user profile"""
    user_response = serialize_user(current_user)
    del user_response["password"]
    return user_response

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update current user profile"""
    
    # Update only provided fields
    update_fields = {k: v for k, v in update_data.dict(exclude_unset=True).items()}
    
    if update_fields:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    user_response = serialize_user(updated_user)
    del user_response["password"]
    
    return user_response

@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: UserChangePassword,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Change current user password"""
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_password_hash = get_password_hash(password_data.new_password)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": new_password_hash}}
    )
    
    return {"message": "Password updated successfully"}

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user_account(
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete current user account and all associated data"""
    
    user_id = str(current_user["_id"])
    
    # Delete user's expenses
    await db.expenses.delete_many({"user_id": user_id})
    
    # Delete user's categories
    await db.categories.delete_many({"user_id": user_id})
    
    # Delete user
    await db.users.delete_one({"_id": current_user["_id"]})
    
    return None

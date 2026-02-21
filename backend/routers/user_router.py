from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from models import UserUpdate, UserChangePassword, UserResponse, WebhookResponse
from auth import get_current_active_user, get_password_hash, verify_password, serialize_user
from database import get_database
import secrets
from datetime import datetime
from pydantic import BaseModel

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

# Webhook endpoints
@router.get("/me/webhook", response_model=WebhookResponse)
async def get_webhook_config(
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get user's webhook configuration"""
    webhook_enabled = current_user.get("webhook_enabled", False)
    webhook_last_received = current_user.get("webhook_last_received")
    user_id = str(current_user["_id"])
    
    # Build public URL
    from config import settings
    webhook_url = f"{settings.FRONTEND_URL.replace('http', 'https').split(':')[0]}://{settings.FRONTEND_URL.split('://')[1].split(':')[0]}/webhooks/sms/{user_id}"
    
    return WebhookResponse(
        enabled=webhook_enabled,
        url=webhook_url,
        last_received=webhook_last_received
    )


class WebhookSetupRequest(BaseModel):
    action: str  # "generate" or "disable"


@router.post("/me/webhook")
async def manage_webhook(
    req: WebhookSetupRequest,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Generate or disable webhook secret"""
    user_id = current_user["_id"]
    
    if req.action == "generate":
        # Generate new secret
        webhook_secret = secrets.token_urlsafe(32)
        
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {
                "webhook_enabled": True,
                "webhook_secret": webhook_secret,
                "webhook_created_at": datetime.utcnow()
            }}
        )
        
        return {
            "status": "success",
            "action": "generated",
            "message": "Webhook secret generated successfully",
            "secret": webhook_secret  # Only return once
        }
    
    elif req.action == "disable":
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {
                "webhook_enabled": False
            }}
        )
        
        return {
            "status": "success",
            "action": "disabled",
            "message": "Webhook disabled successfully"
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action")


@router.get("/me/webhook/sms-logs")
async def get_sms_logs(
    limit: int = 20,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get recent SMS webhook logs for current user"""
    user_id = str(current_user["_id"])
    
    # Fetch recent SMS logs
    cursor = db.sms_logs.find({"user_id": user_id}).sort("received_at", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for log in logs:
        log["_id"] = str(log["_id"])
        log["received_at"] = log["received_at"].isoformat() if isinstance(log["received_at"], datetime) else log["received_at"]
    
    return {
        "count": len(logs),
        "logs": logs
    }


@router.get("/me/webhook/debug")
async def get_webhook_debug_info(
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get webhook debug information"""
    user_id = str(current_user["_id"])
    
    # Get webhook config
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent SMS logs (any status)
    cursor = db.sms_logs.find({"user_id": user_id}).sort("received_at", -1).limit(5)
    recent_logs = await cursor.to_list(length=5)
    
    # Convert to display format
    for log in recent_logs:
        log["_id"] = str(log["_id"])
        log["received_at"] = log["received_at"].isoformat() if isinstance(log["received_at"], datetime) else log["received_at"]
    
    return {
        "user_id": user_id,
        "webhook_enabled": user.get("webhook_enabled", False),
        "webhook_secret_set": bool(user.get("webhook_secret")),
        "phone": user.get("phone"),
        "webhook_created_at": user.get("webhook_created_at").isoformat() if user.get("webhook_created_at") else None,
        "webhook_last_received": user.get("webhook_last_received").isoformat() if user.get("webhook_last_received") else None,
        "recent_sms_logs": recent_logs,
        "total_sms_count": await db.sms_logs.count_documents({"user_id": user_id})
    }


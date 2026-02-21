import hmac
import hashlib
import json
from fastapi import APIRouter, Request, HTTPException, Depends, status
from datetime import datetime
from config import settings
from database import get_database
from models import ExpenseCreate, ExpenseSource
import logging
from concurrent.futures import ThreadPoolExecutor
import asyncio
from bson import ObjectId

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

async def call_gradio_llm(sms_text: str) -> dict:
    """Call Gradio API to parse SMS and extract transaction details"""
    if not settings.GRADIO_API_URL:
        logger.warning("Gradio API URL not configured, using basic parsing")
        return parse_sms_basic(sms_text)
    
    try:
        from gradio_client import Client
        client = Client(settings.GRADIO_API_URL)
        loop = asyncio.get_event_loop()
        
        with ThreadPoolExecutor() as executor:
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    executor,
                    lambda: client.predict(message=sms_text, api_name="/predict")
                ),
                timeout=10.0
            )
        
        llm_response = result
        if isinstance(llm_response, str):
            llm_response = llm_response.strip()
            if llm_response.startswith('"') and llm_response.endswith('"'):
                llm_response = llm_response[1:-1]
            llm_response = llm_response.replace('\\"', '"')
            parsed_json = json.loads(llm_response)
        else:
            parsed_json = llm_response
        
        return parsed_json
    except Exception as e:
        logger.error(f"Gradio API error: {str(e)}, falling back to basic parsing")
        return parse_sms_basic(sms_text)

def parse_sms_basic(text: str) -> dict:
    """Basic SMS parsing fallback"""
    import re
    
    parsed = {
        "merchant": "SMS Transaction",
        "amount": None,
        "description": text[:200]
    }
    
    # Try to extract amount
    amount_pattern = r'(₹|Rs\.?|USD|\$)\s*(\d+(?:[.,]\d{2})?)'
    match = re.search(amount_pattern, text, re.IGNORECASE)
    if match:
        amount_str = match.group(2).replace(',', '')
        try:
            parsed["amount"] = float(amount_str)
        except:
            pass
    
    # Try to extract merchant name
    merchant_pattern = r'(?:at|from)\s+([A-Za-z\s]+?)(?:\.|,|for)'
    merchant_match = re.search(merchant_pattern, text)
    if merchant_match:
        parsed["merchant"] = merchant_match.group(1).strip()
    
    return parsed

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify webhook signature using HMAC-SHA256"""
    if not secret:
        logger.warning("No webhook secret provided, skipping signature verification")
        return True
    
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)

@router.post("/sms/{user_id}")
async def receive_sms_webhook(user_id: str, request: Request, db = Depends(get_database)):
    """
    User-specific webhook endpoint to receive SMS from textbee.dev
    Automatically creates expenses based on incoming SMS
    URL: /webhooks/sms/{user_id}
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        signature = request.headers.get("x-signature")
        
        logger.info(f"Webhook received for user_id: {user_id}")
        
        # Find user
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except Exception as e:
            logger.error(f"Invalid user_id format: {user_id} - {str(e)}")
            return {
                "status": "error",
                "detail": "Invalid user ID"
            }
        
        if not user:
            logger.warning(f"User not found: {user_id}")
            return {
                "status": "error",
                "detail": "User not found"
            }
        
        # Check if webhook is enabled
        if not user.get("webhook_enabled"):
            logger.warning(f"Webhook not enabled for user: {user_id}")
            return {
                "status": "error",
                "detail": "Webhook not enabled"
            }
        
        webhook_secret = user.get("webhook_secret")
        
        # Verify signature if secret exists
        if signature and webhook_secret:
            if not verify_webhook_signature(body, signature, webhook_secret):
                logger.warning(f"Invalid webhook signature for user {user_id}")
                return {
                    "status": "error",
                    "detail": "Invalid signature"
                }
        
        try:
            payload = json.loads(body)
        except Exception as e:
            logger.error(f"Invalid JSON payload: {str(e)}")
            return {
                "status": "error",
                "detail": "Invalid JSON payload"
            }
        
        # Check if it's a MESSAGE_RECEIVED event
        if payload.get("webhookEvent") != "MESSAGE_RECEIVED":
            logger.info(f"Ignoring non-MESSAGE_RECEIVED event: {payload.get('webhookEvent')}")
            return {"status": "ignored"}
        
        # Extract SMS data
        sender_phone = payload.get("sender", "").replace("+", "").replace("-", "")
        message_text = payload.get("message", "")
        received_at = payload.get("receivedAt", datetime.utcnow().isoformat())
        
        logger.info(f"Received SMS for user {user_id} from {sender_phone}: {message_text[:50]}")
        
        # Parse SMS to extract expense details
        try:
            parsed_data = await call_gradio_llm(message_text)
        except Exception as e:
            logger.error(f"Failed to parse SMS: {str(e)}")
            parsed_data = parse_sms_basic(message_text)
        
        # Extract values
        merchant = parsed_data.get("merchant", "SMS Transaction")
        amount = parsed_data.get("amount")
        category = parsed_data.get("category", settings.SMS_DEFAULT_CATEGORY)
        description = parsed_data.get("description", message_text[:200])
        
        # Skip if amount is missing
        if not amount or amount <= 0:
            logger.warning(f"No valid amount found in SMS: {message_text[:50]}")
            
            # Log failed SMS attempt
            sms_log = {
                "user_id": user_id,
                "sender": sender_phone,
                "message": message_text,
                "status": "failed",
                "reason": "no_amount_found",
                "received_at": datetime.utcnow()
            }
            await db.sms_logs.insert_one(sms_log)
            
            return {"status": "no_amount_found"}
        
        # Create expense
        try:
            expense_dict = {
                "merchant": merchant[:200],
                "amount": amount,
                "category": category,
                "date": datetime.fromisoformat(received_at) if received_at else datetime.utcnow(),
                "description": description,
                "source": ExpenseSource.SMS.value,
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "updated_at": None
            }
            
            result = await db.expenses.insert_one(expense_dict)
            
            # Update category count
            await db.categories.update_one(
                {"user_id": user_id, "name": category},
                {"$inc": {"count": 1}},
                upsert=False
            )
            
            # Log SMS for verification
            sms_log = {
                "user_id": user_id,
                "sender": sender_phone,
                "message": message_text,
                "merchant": merchant,
                "amount": amount,
                "category": category,
                "expense_id": str(result.inserted_id),
                "status": "success",
                "received_at": datetime.utcnow()
            }
            await db.sms_logs.insert_one(sms_log)
            
            # Update user's last webhook received time
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"webhook_last_received": datetime.utcnow()}}
            )
            
            logger.info(f"Created expense {result.inserted_id} for user {user_id}")
            return {
                "status": "success",
                "expense_id": str(result.inserted_id),
                "amount": amount,
                "merchant": merchant
            }
        
        except Exception as e:
            logger.error(f"Failed to create expense: {str(e)}")
            
            # Log error
            sms_log = {
                "user_id": user_id,
                "sender": sender_phone,
                "message": message_text,
                "status": "error",
                "reason": str(e)[:100],
                "received_at": datetime.utcnow()
            }
            await db.sms_logs.insert_one(sms_log)
            
            return {
                "status": "error",
                "detail": f"Failed to create expense: {str(e)}"
            }
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "detail": str(e)
        }


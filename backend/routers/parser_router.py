from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from typing import Optional
import re
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from models import SMSParseRequest, ParsedExpenseData, LineItem
from auth import get_current_active_user
from database import get_database
from config import settings
import httpx
import os
from pydantic import BaseModel

class VoiceTextRequest(BaseModel):
    text: str

router = APIRouter(prefix="/parse", tags=["Parsers"])

async def call_gradio_llm(sms_text: str) -> dict:
    """
    Call Gradio API to extract transaction details from SMS using LLM
    Returns parsed JSON object from the string response
    """
    if not settings.GRADIO_API_URL:
        raise HTTPException(
            status_code=503,
            detail="Gradio API URL not configured. Please set GRADIO_API_URL in .env file"
        )
    
    try:
        # Use httpx to call Gradio API directly
        base_url = settings.GRADIO_API_URL.rstrip('/')
        llm_response = None
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Gradio 5.x uses /gradio_api/call/predict then fetches result
            # Step 1: Submit the request
            call_response = await client.post(
                f"{base_url}/gradio_api/call/predict",
                json={"data": [sms_text]}
            )
            
            if call_response.status_code == 200:
                event_id = call_response.json().get("event_id")
                if event_id:
                    # Step 2: Get the result using SSE
                    max_attempts = 60
                    for attempt in range(max_attempts):
                        result_response = await client.get(
                            f"{base_url}/gradio_api/call/predict/{event_id}",
                            timeout=120.0
                        )
                        
                        if result_response.status_code == 200:
                            # Parse SSE response
                            for line in result_response.text.split('\n'):
                                if line.startswith('data:'):
                                    try:
                                        data_str = line[5:].strip()
                                        if data_str:
                                            event_data = json.loads(data_str)
                                            # Result is directly in the array
                                            if isinstance(event_data, list) and len(event_data) > 0:
                                                llm_response = event_data[0]
                                                break
                                    except json.JSONDecodeError:
                                        continue
                            if llm_response is not None:
                                break
                        await asyncio.sleep(1)
            
            # Fallback: Try older /run/predict endpoint
            if llm_response is None:
                response = await client.post(
                    f"{base_url}/run/predict",
                    json={"data": [sms_text]}
                )
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, dict) and "data" in result:
                        llm_response = result["data"][0] if result["data"] else ""
            
            if llm_response is None:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to get response from Gradio API"
                )
        
        # If the response is a string containing JSON, parse it
        if isinstance(llm_response, str):
            # Clean the string if it has extra quotes or whitespace
            llm_response = llm_response.strip()
            # Remove leading/trailing quotes if present
            if llm_response.startswith('"') and llm_response.endswith('"'):
                llm_response = llm_response[1:-1]
            # Unescape any escaped quotes
            llm_response = llm_response.replace('\\"', '"')
            # Parse the JSON string
            parsed_json = json.loads(llm_response)
        else:
            parsed_json = llm_response
                
        return parsed_json
        
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Gradio API request timed out after 60 seconds. The LLM is taking too long to respond."
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse Gradio API response as JSON: {str(e)}. Response: {llm_response[:200] if isinstance(llm_response, str) else str(llm_response)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Check for timeout in error message
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            raise HTTPException(
                status_code=504,
                detail=f"Gradio API connection timed out: {error_msg}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Error calling Gradio API: {error_msg}"
        )

@router.post("/voice-text", response_model=ParsedExpenseData)
async def parse_voice_text(
    request: VoiceTextRequest,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """
    Parse voice-transcribed text to extract transaction details using Gradio LLM API
    Same as SMS parsing but for voice input
    """
    try:
        # Call Gradio LLM to parse voice text (same as SMS)
        llm_result = await call_gradio_llm(request.text)
        
        # Parse date from LLM result - convert string to datetime
        date_value = datetime.now()
        date_str = llm_result.get('date', '')
        if date_str and date_str != 'not specified':
            try:
                date_value = datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                try:
                    date_value = datetime.strptime(date_str, '%d-%m-%Y')
                except ValueError:
                    date_value = datetime.now()
        
        # Extract parsed data from LLM result
        parsed_data = ParsedExpenseData(
            amount=llm_result.get('amount', 0.0),
            merchant=llm_result.get('merchant', '') or llm_result.get('beneficiary', '') or 'Voice Transaction',
            date=date_value,
            category=llm_result.get('category', 'Other'),
            confidence=0.8,
            source='voice',
            description=request.text,
            items=[],
            tax=0.0,
            discount=0.0
        )
        
        # Get user's categories to validate
        categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
        
        # Validate category
        if categories:
            category_names = [cat["name"] for cat in categories]
            if parsed_data.category not in category_names:
                # Try case-insensitive match
                matched = None
                for cat_name in category_names:
                    if cat_name.lower() == parsed_data.category.lower():
                        matched = cat_name
                        break
                if matched:
                    parsed_data.category = matched
                else:
                    parsed_data.category = categories[0]["name"]
        
        return parsed_data
        
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Gradio API request timed out. The LLM service may be overloaded. Please try again."
        )
    except Exception as e:
        print(f"Voice text parsing error: {str(e)}")
        # Return basic parsed data as fallback
        return ParsedExpenseData(
            amount=0.0,
            merchant='Voice Transaction',
            date=datetime.now(),
            category='Other',
            confidence=0.3,
            source='voice',
            description=request.text,
            items=[],
            tax=0.0,
            discount=0.0
        )

@router.post("/sms", response_model=ParsedExpenseData)
async def parse_sms(
    request: SMSParseRequest,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Parse expense information from SMS text using Gradio LLM API"""
    text = request.text.strip()
    
    # Initialize parsed data
    parsed = ParsedExpenseData(confidence=0.0)
    
    try:
        # Call Gradio LLM API to extract transaction details
        llm_result = await call_gradio_llm(text)
        
        # Map LLM response to ParsedExpenseData
        # Expected format: {"amount": 23360.0, "type": "debit", "category": "loan", 
        #                  "account": "6084", "bank": "SBI", "merchant": "not specified", ...}
        
        # Extract amount
        if "amount" in llm_result and llm_result["amount"]:
            parsed.amount = float(llm_result["amount"])
            parsed.confidence += 0.4
        
        # Extract merchant - check merchant, beneficiary, or bank
        merchant = None
        if llm_result.get("merchant") and llm_result["merchant"] != "not specified":
            merchant = llm_result["merchant"]
        elif llm_result.get("beneficiary") and llm_result["beneficiary"] != "not specified":
            merchant = llm_result["beneficiary"]
        elif llm_result.get("bank"):
            merchant = llm_result["bank"]
        
        if merchant:
            parsed.merchant = merchant
            parsed.confidence += 0.2
        
        # Extract category
        if "category" in llm_result and llm_result["category"]:
            category_name = llm_result["category"].strip().lower()
            
            # Get user's categories
            categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
            
            # Try to match the category (case-insensitive)
            matched_category = None
            for cat in categories:
                if cat["name"].lower() == category_name:
                    matched_category = cat["name"]
                    break
            
            if matched_category:
                parsed.category = matched_category
                parsed.confidence += 0.3
            else:
                # Try to find similar category or use first available
                if categories:
                    # Check for partial matches
                    for cat in categories:
                        if category_name in cat["name"].lower() or cat["name"].lower() in category_name:
                            matched_category = cat["name"]
                            break
                    parsed.category = matched_category if matched_category else categories[0]["name"]
                parsed.confidence += 0.1
        
        # Extract date
        if "date" in llm_result and llm_result["date"]:
            try:
                # Try parsing the date string
                date_str = llm_result["date"]
                if date_str != "not specified":
                    parsed.date = datetime.strptime(date_str, "%Y-%m-%d")
                    parsed.confidence += 0.1
            except:
                pass
        
        # If no date found, use current date
        if not parsed.date:
            parsed.date = datetime.utcnow()
        
        # Extract transaction type (debit/credit)
        transaction_type = llm_result.get("type", "debit")
        
        # Check if it's P2M (Person to Merchant) transaction
        is_p2m = llm_result.get("is_p2m", False)
        
        # Extract additional details for description
        account = llm_result.get("account", "")
        bank = llm_result.get("bank", "")
        reference = llm_result.get("reference", "")
        vpa = llm_result.get("vpa", "")
        status = llm_result.get("status", "")
        
        # Create comprehensive description
        description_parts = [f"{transaction_type.capitalize()} transaction"]
        
        if parsed.merchant:
            description_parts.append(f"from {parsed.merchant}")
        
        if is_p2m:
            description_parts.append("(P2M)")
        
        if account and account != "not specified":
            description_parts.append(f"A/C: {account}")
        
        if bank and bank != "not specified":
            description_parts.append(f"via {bank}")
        
        if vpa and vpa != "not specified":
            description_parts.append(f"VPA: {vpa}")
        
        if reference and reference != "not specified":
            description_parts.append(f"Ref: {reference}")
        
        if status and status != "not specified":
            description_parts.append(f"[{status.upper()}]")
        
        parsed.description = " ".join(description_parts)
        
        # If no merchant was found, extract from SMS using regex
        if not parsed.merchant:
            merchant_patterns = [
                r'(?:at|to|for)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+on|\s+dated|\.|$)',
                r'(?:merchant|vendor)[:\s]+([A-Za-z0-9\s&]+)',
                r'(?:spent|paid).*?at\s+([A-Z][A-Za-z0-9\s&]+)',
            ]
            
            for pattern in merchant_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    merchant = match.group(1).strip()
                    merchant = re.sub(r'\s+', ' ', merchant)
                    if len(merchant) > 3:
                        parsed.merchant = merchant
                        parsed.confidence += 0.1
                        break
        
        # Final fallback for merchant
        if not parsed.merchant:
            if bank and bank != "not specified":
                parsed.merchant = f"{bank} Transaction"
            elif parsed.category:
                parsed.merchant = f"{parsed.category} Transaction"
            else:
                parsed.merchant = "SMS Transaction"
        
        # Ensure we have a category
        if not parsed.category:
            categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
            if categories:
                parsed.category = categories[0]["name"]
        
        return parsed
        
    except HTTPException:
        # Re-raise HTTP exceptions from Gradio API
        raise
    except Exception as e:
        # If LLM parsing fails, fall back to regex-based parsing
        print(f"LLM parsing failed, falling back to regex: {str(e)}")
        return await parse_sms_fallback(text, current_user, db)


async def parse_sms_fallback(text: str, current_user: dict, db) -> ParsedExpenseData:
    """Fallback regex-based SMS parsing if LLM API fails"""
    parsed = ParsedExpenseData(confidence=0.0)
    
    # Common patterns for SMS transaction notifications
    # Pattern 1: "Spent Rs.500 at Starbucks on 12/12/2024"
    # Pattern 2: "Rs 500 debited from your account for AMAZON on 12-Dec-2024"
    # Pattern 3: "Transaction of $25.50 at UBER"
    
    # Extract amount (supports $, Rs, INR, USD formats)
    amount_patterns = [
        r'(?:Rs\.?|INR|₹)\s*([0-9,]+\.?[0-9]*)',
        r'\$\s*([0-9,]+\.?[0-9]*)',
        r'(?:USD|EUR|GBP)\s*([0-9,]+\.?[0-9]*)',
        r'amount[:\s]+(?:Rs\.?|INR|₹|\$)?\s*([0-9,]+\.?[0-9]*)',
    ]
    
    amount = None
    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            amount_str = match.group(1).replace(',', '')
            try:
                amount = float(amount_str)
                parsed.amount = amount
                parsed.confidence += 0.3
                break
            except ValueError:
                continue
    
    # Extract merchant name
    merchant_keywords = ['at', 'to', 'for', 'from']
    merchant_patterns = [
        r'(?:at|to|for)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+on|\s+dated|\s+dated|\.|$)',
        r'(?:merchant|vendor)[:\s]+([A-Za-z0-9\s&]+)',
    ]
    
    merchant = None
    for pattern in merchant_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            # Clean up merchant name
            merchant = re.sub(r'\s+', ' ', merchant)
            if len(merchant) > 3:
                parsed.merchant = merchant
                parsed.confidence += 0.3
                break
    
    # Extract date
    date_patterns = [
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})',
        r'(?:on|dated)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
    ]
    
    date = None
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(1)
            # Try to parse the date
            for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y', '%d %b %Y', '%d %B %Y']:
                try:
                    date = datetime.strptime(date_str, fmt)
                    parsed.date = date
                    parsed.confidence += 0.2
                    break
                except ValueError:
                    continue
            if date:
                break
    
    # If no date found, use current date
    if not parsed.date:
        parsed.date = datetime.utcnow()
    
    # Category inference based on merchant name
    if parsed.merchant:
        merchant_lower = parsed.merchant.lower()
        
        # Get user's categories
        categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
        category_names = [cat["name"] for cat in categories]
        
        # Default category mappings
        category_keywords = {
            "Food & Dining": ["restaurant", "cafe", "coffee", "starbucks", "mcdonald", "pizza", "food", "swiggy", "zomato", "dunkin"],
            "Transportation": ["uber", "lyft", "taxi", "gas", "fuel", "petrol", "metro", "train", "bus"],
            "Shopping": ["amazon", "flipkart", "walmart", "target", "mall", "store", "shop"],
            "Entertainment": ["netflix", "spotify", "movie", "cinema", "theater", "game", "prime"],
            "Bills & Utilities": ["electric", "water", "internet", "phone", "bill", "utility"],
            "Healthcare": ["hospital", "pharmacy", "medical", "doctor", "clinic"],
        }
        
        for category, keywords in category_keywords.items():
            if category in category_names:
                if any(keyword in merchant_lower for keyword in keywords):
                    parsed.category = category
                    parsed.confidence += 0.2
                    break
    
    # Set default category if not found
    if not parsed.category:
        categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
        if categories:
            parsed.category = categories[0]["name"]
    
    # Add description
    if parsed.merchant:
        parsed.description = f"SMS transaction at {parsed.merchant}"
    
    return parsed

@router.post("/receipt", response_model=ParsedExpenseData)
async def parse_receipt(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Parse expense information from receipt image using YOLO and OCR"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        
        # Check if YOLO model is configured
        if not settings.YOLO_MODEL_PATH:
            print("YOLO_MODEL_PATH not configured in settings")
            return await parse_receipt_fallback(file.filename, current_user, db)
        
        if not os.path.exists(settings.YOLO_MODEL_PATH):
            print(f"YOLO model not found at: {settings.YOLO_MODEL_PATH}")
            return await parse_receipt_fallback(file.filename, current_user, db)
        
        print(f"Loading YOLO model from: {settings.YOLO_MODEL_PATH}")
        
        # Import YOLO parser (lazy import to avoid loading if not configured)
        from routers.yolo_parser import detect_and_extract
        
        # Run YOLO detection and OCR
        print(f"Processing receipt image: {file.filename} ({len(contents)} bytes)")
        result = detect_and_extract(settings.YOLO_MODEL_PATH, contents)
        print(f"YOLO extraction result: {result}")
        
        # Convert YOLO output to ParsedExpenseData
        parsed = ParsedExpenseData(confidence=0.8)
        
        # Debug: Log raw YOLO output
        print(f"Raw YOLO output - name: '{result.get('name')}', total: {result.get('total')}, items sum: {sum(item.get('price', 0) for item in result.get('items', []) if item.get('price') is not None)}")
        print(f"Raw YOLO output - tax: {result.get('tax')}, discount: {result.get('discount')}")
        
        # Map merchant name (handle empty strings)
        merchant_name = result.get("name", "").strip()
        parsed.merchant = merchant_name if merchant_name else "Receipt Transaction"
        
        # Map amount (this is the final total after tax/discount)
        parsed.amount = float(result.get("total", 0.0))
        
        # Map date
        date_str = result.get("date")
        if date_str:
            try:
                parsed.date = datetime.strptime(date_str, "%Y-%m-%d")
            except:
                parsed.date = datetime.utcnow()
        else:
            parsed.date = datetime.utcnow()
        
        # Map items
        items = result.get("items", [])
        if items:
            parsed.items = [
                LineItem(
                    product=item.get("product", ""),
                    price=float(item.get("price")) if item.get("price") not in ("", None) else None
                )
                for item in items
            ]
        
        # Map tax and discount
        parsed.tax = float(result.get("tax", 0.0))
        parsed.discount = float(result.get("discount", 0.0))
        parsed.time = result.get("time")
        
        # Create description
        item_count = len(items)
        desc_parts = [f"Receipt from {parsed.merchant}"]
        if item_count > 0:
            desc_parts.append(f"({item_count} item{'s' if item_count != 1 else ''})")
        if parsed.tax > 0:
            desc_parts.append(f"+ Tax: ${parsed.tax:.2f}")
        if parsed.discount > 0:
            desc_parts.append(f"Discount: ${parsed.discount:.2f}")
        parsed.description = " ".join(desc_parts)
        
        # Infer category based on merchant name
        if parsed.merchant:
            merchant_lower = parsed.merchant.lower()
            
            # Get user's categories
            categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
            category_names = [cat["name"] for cat in categories]
            
            # Category mappings
            category_keywords = {
                "Food & Dining": ["restaurant", "cafe", "coffee", "starbucks", "mcdonald", "pizza", "food", "swiggy", "zomato", "dunkin", "kitchen", "bistro", "diner"],
                "Groceries": ["grocery", "supermarket", "mart", "store", "walmart", "target", "kroger", "safeway"],
                "Shopping": ["amazon", "flipkart", "mall", "shop", "boutique", "retail"],
                "Transportation": ["uber", "lyft", "taxi", "gas", "fuel", "petrol"],
                "Entertainment": ["movie", "cinema", "theater", "netflix", "game"],
                "Healthcare": ["pharmacy", "medical", "hospital", "clinic", "drug"],
            }
            
            for category, keywords in category_keywords.items():
                if category in category_names:
                    if any(keyword in merchant_lower for keyword in keywords):
                        parsed.category = category
                        break
        
        # Set default category if not found
        if not parsed.category:
            categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
            if categories:
                parsed.category = categories[0]["name"]
        
        return parsed
        
    except HTTPException:
        raise
    except ImportError as e:
        print(f"Failed to import YOLO dependencies: {str(e)}")
        print("Falling back to basic parsing. Install required packages: pip install ultralytics easyocr opencv-python")
        return await parse_receipt_fallback(file.filename, current_user, db)
    except ValueError as e:
        print(f"Image processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
    except Exception as e:
        print(f"YOLO parsing failed with error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        # Fallback to basic parsing
        return await parse_receipt_fallback(file.filename, current_user, db)


async def parse_receipt_fallback(filename: str, current_user: dict, db) -> ParsedExpenseData:
    """Fallback receipt parsing when YOLO is not available"""
    parsed = ParsedExpenseData(confidence=0.3)
    parsed.merchant = "Receipt Upload"
    parsed.amount = 0.0
    parsed.date = datetime.utcnow()
    parsed.description = f"Receipt uploaded: {filename}"
    
    # Get default category
    categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
    if categories:
        parsed.category = categories[0]["name"]
    
    return parsed

@router.post("/voice", response_model=ParsedExpenseData)
async def parse_voice(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Parse expense information from voice recording"""
    
    # Validate file type
    if not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        # Read audio file
        contents = await file.read()
        
        # Initialize parsed data
        parsed = ParsedExpenseData(confidence=0.5)
        
        # For now, return a placeholder response
        # In production, you would use speech-to-text service
        parsed.merchant = "Voice Entry"
        parsed.amount = 0.0
        parsed.date = datetime.utcnow()
        parsed.description = f"Voice recording: {file.filename}"
        
        # Get default category
        categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
        if categories:
            parsed.category = categories[0]["name"]
        
        # TODO: Implement actual speech-to-text processing
        # This would involve:
        # 1. Convert audio to appropriate format
        # 2. Use speech-to-text API (Google Speech-to-Text, AWS Transcribe, OpenAI Whisper)
        # 3. Parse transcribed text to extract expense details
        # 4. Return structured data
        
        return parsed
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")

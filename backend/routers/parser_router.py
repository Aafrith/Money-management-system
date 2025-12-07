from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import Optional
import re
from datetime import datetime
from models import SMSParseRequest, ParsedExpenseData
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/parse", tags=["Parsers"])

@router.post("/sms", response_model=ParsedExpenseData)
async def parse_sms(
    request: SMSParseRequest,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Parse expense information from SMS text"""
    text = request.text.strip()
    
    # Initialize parsed data
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
    """Parse expense information from receipt image using OCR"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        
        # Initialize parsed data
        parsed = ParsedExpenseData(confidence=0.5)
        
        # For now, return a placeholder response
        # In production, you would use pytesseract or a cloud OCR service
        parsed.merchant = "Receipt Upload"
        parsed.amount = 0.0
        parsed.date = datetime.utcnow()
        parsed.description = f"Receipt uploaded: {file.filename}"
        
        # Get default category
        categories = await db.categories.find({"user_id": str(current_user["_id"])}).to_list(length=None)
        if categories:
            parsed.category = categories[0]["name"]
        
        # TODO: Implement actual OCR processing
        # This would involve:
        # 1. Image preprocessing (grayscale, threshold, denoise)
        # 2. OCR using pytesseract or cloud service (Google Vision, AWS Textract)
        # 3. Text parsing to extract merchant, amount, date, items
        # 4. Return structured data
        
        return parsed
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

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

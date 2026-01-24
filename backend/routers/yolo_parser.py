"""
YOLO-based receipt parser for extracting transaction details from bill images
"""
from ultralytics import YOLO
import json
from datetime import datetime
import re
import easyocr
import cv2
import numpy as np
from typing import Dict, List, Optional
import os
from config import settings

# Initialize OCR reader (lazy loading)
_reader = None

def get_ocr_reader():
    """Lazy load OCR reader"""
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(['en'])  # Only English
    return _reader

# Define class names
CLASS_NAMES = ["Merchant", "date", "total", "no", "item"]

# Regex for number extraction
NUMBER_RE = re.compile(r"\d+(?:\.\d+)?")

# Date patterns (common formats)
DATE_PATTERNS = [
    r"(\d{2}[/-]\d{2}[/-]\d{2,4})",  # 18/10/18 or 18-10-2018
    r"(\d{4}[/-]\d{2}[/-]\d{2})"     # 2018-10-18
]

# Time patterns
TIME_PATTERNS = [
    r"(\d{1,2}:\d{2}(:\d{2})?)"
]

def parse_date(text: str) -> Optional[str]:
    """Parse date from OCR text"""
    text = text.replace('Date', '').replace('date', '').replace(':', '').strip()
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            dt_str = match.group(1)
            for fmt in ("%d/%m/%y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
                try:
                    dt = datetime.strptime(dt_str, fmt)
                    return dt.strftime("%Y-%m-%d")
                except:
                    continue
    return None

def parse_time(text: str) -> Optional[str]:
    """Parse time from OCR text"""
    text = text.replace('Time', '').replace('time', '').replace(':', '').strip()
    for pattern in TIME_PATTERNS:
        match = re.search(pattern, text)
        if match:
            tm_str = match.group(1)
            for fmt in ("%H:%M:%S", "%H:%M"):
                try:
                    tm = datetime.strptime(tm_str, fmt)
                    return tm.strftime("%H:%M:%S")
                except:
                    continue
    return None

def extract_total_amount(total_str: str) -> Optional[float]:
    """Extract the rightmost numeric value from total text."""
    if not total_str:
        return None
    matches = NUMBER_RE.findall(total_str)
    for m in matches[::-1]:  # check from rightmost (likely total)
        try:
            return float(m.replace(",", ""))
        except:
            continue
    return None

def normalize_ocr_text(s: str) -> str:
    """Normalize OCR text by cleaning up whitespace"""
    s = s.replace('\n', ' ').strip()
    s = re.sub(r'\s{2,}', ' ', s)
    return s

# Find numbers like 1,100.00 or 100.00 or 150 or 15,00 (comma decimals)
NUMBER_RE_PARSE = re.compile(r'[-+]?\d{1,3}(?:[,\d]*\d)?(?:[.,]\d{1,2})?')

def extract_numbers_parse(s: str) -> List[float]:
    """Extract all numbers from a string"""
    tokens = NUMBER_RE_PARSE.findall(s)
    nums = []
    for t in tokens:
        # normalize comma/period usage: if both present, remove thousands commas
        t_norm = t.replace(',', '')
        # handle commas used as decimal like '550,00' -> '550.00'
        if ',' in t and '.' not in t and re.search(r',\d{1,2}$', t):
            t_norm = t.replace(',', '.')
        try:
            val = float(t_norm)
            nums.append(val)
        except:
            continue
    return nums

def pick_price_from_numbers(numbers: List[float], original_str: str) -> Optional[float]:
    """Pick the most likely price from extracted numbers"""
    if not numbers:
        return None
    # If same number repeats and is largest, it's likely the line total
    if len(numbers) > 1:
        largest = max(numbers)
        # repeated check
        if numbers.count(largest) >= 1:
            return largest
        # heuristic: return rightmost numeric token if it's within 10% of largest
        # find tokens order from string and pick the rightmost
        matches = NUMBER_RE_PARSE.finditer(original_str)
        found = [m.group(0) for m in matches]
        if found:
            last = found[-1]
            last_val = None
            try:
                t = last.replace(',', '')
                if ',' in last and '.' not in last and re.search(r',\d{1,2}$', last):
                    t = last.replace(',', '.')
                last_val = float(t)
            except:
                last_val = None
            if last_val is not None:
                return last_val
        # fallback to largest
        return largest
    else:
        return numbers[0]

def clean_product_name(s: str) -> str:
    """Clean product name by removing numeric tokens, qty/units, currency symbols"""
    s = re.sub(r'\b(x|qty|pcs|pc|nos|no|each)\b', '', s, flags=re.IGNORECASE)
    s = re.sub(NUMBER_RE_PARSE, '', s)  # remove numbers
    s = re.sub(r'[\$₹£€:,()*`"""]', ' ', s)
    s = re.sub(r'\s{2,}', ' ', s).strip()
    return s

def parse_line_item(raw_line: str) -> Dict:
    """Parse a single line item to extract product name and price"""
    raw = normalize_ocr_text(raw_line)
    numbers = extract_numbers_parse(raw)
    price = pick_price_from_numbers(numbers, raw)
    product = clean_product_name(raw)
    return {
        "product": product if product else raw_line,
        "price": f"{price:.2f}" if price is not None else ""
    }

def detect_and_extract(model_path: str, image_bytes: bytes) -> Dict:
    """
    Detect and extract receipt details using YOLO model
    
    Args:
        model_path: Path to YOLO model weights
        image_bytes: Image file bytes
        
    Returns:
        Dictionary with extracted receipt data
    """
    try:
        # Load model
        print(f"Loading YOLO model from: {model_path}")
        model = YOLO(model_path)
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image - invalid image format or corrupted file")
        
        print(f"Image decoded successfully: {img.shape}")
    except Exception as e:
        raise ValueError(f"Failed to load model or decode image: {str(e)}")
    
    # Get OCR reader
    reader = get_ocr_reader()
    
    # Run YOLO detection
    print("Running YOLO detection...")
    results = model(img)[0]
    print(f"Detected {len(results.boxes)} objects")
    
    output = {
        "items": [],
        "name": "",
        "total": "",
        "date": "",
        "time": "",
        "discount": 0.0,
        "tax": 0.0
    }
    
    # Process each detection
    for box, cls_id, conf in zip(results.boxes.xyxy, results.boxes.cls, results.boxes.conf):
        x1, y1, x2, y2 = [int(i) for i in box]
        cls_id = int(cls_id)
        cls_name = CLASS_NAMES[cls_id]
        
        print(f"Processing {cls_name} box with confidence {conf:.2f}")
        
        # Crop detected box
        crop = img[y1:y2, x1:x2]
        
        # OCR on the crop
        text_result = reader.readtext(crop)
        text = " ".join([t[1] for t in text_result])  # concatenate all detected text
        print(f"  OCR text: {text}")
        
        # Map detected text to JSON fields
        if cls_name == "Merchant":
            output["name"] = text
        elif cls_name == "date":
            parsed_date = parse_date(text)
            if parsed_date:
                output["date"] = parsed_date
        elif cls_name == "total":
            output["total"] = text
        elif cls_name == "no":
            parsed_time = parse_time(text)
            if parsed_time:
                output["time"] = parsed_time
        elif cls_name == "item":
            # Initial extraction
            parts = text.rsplit(" ", 1)
            old_price = None
            product_text = text
            
            if len(parts) == 2:
                try:
                    old_price = float(parts[1].replace(",", "").replace("O", "0"))
                    product_text = parts[0]
                except:
                    old_price = None
            
            # Refine using parse_line_item
            parsed = parse_line_item(text)
            new_product = parsed["product"]
            new_price = float(parsed["price"]) if parsed["price"] else None
            
            candidates = []
            if old_price is not None and old_price <= 1000000:
                candidates.append(old_price)
            if new_price is not None and new_price <= 1000000:
                candidates.append(new_price)
            
            final_price = round(min(candidates), 2) if candidates else None
            
            # Only add items with valid prices
            if final_price is not None:
                output["items"].append({
                    "product": new_product,
                    "price": final_price
                })
    
    # Post-processing totals
    model_total = extract_total_amount(output.get("total", ""))
    
    # Calculate item sum - only include items with numeric prices
    item_sum = 0.0
    for item in output["items"]:
        price = item.get("price")
        if price is not None and isinstance(price, (int, float)):
            item_sum += float(price)
    
    if model_total is None or (item_sum > 0 and model_total > item_sum * 10):
        # Sanity filter: ignore total if it's invalid or > 10x item sum
        model_total = round(item_sum, 2)
        tax = 0.0
        discount = 0.0
    else:
        if abs(model_total - item_sum) < 0.01:
            tax, discount = 0.0, 0.0
        elif model_total > item_sum:
            tax = round(model_total - item_sum, 2)
            discount = 0.0
        else:
            discount = round(item_sum - model_total, 2)
            tax = 0.0
    
    output["total"] = model_total
    output["tax"] = tax if tax else 0.0
    output["discount"] = discount if discount else 0.0
    
    # Fill missing date/time with today
    now = datetime.now()
    if not output["date"]:
        output["date"] = now.strftime("%Y-%m-%d")
    if not output["time"]:
        output["time"] = now.strftime("%H:%M:%S")
    
    print(f"Final output: {len(output['items'])} items, total: {output['total']}, merchant: {output['name']}")
    
    return output

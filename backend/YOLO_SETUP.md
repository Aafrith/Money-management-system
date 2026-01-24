# YOLO Receipt Parser Integration Guide

## Overview

The Money Management System now includes YOLO-based receipt parsing that automatically extracts itemized transaction details from receipt images using object detection and OCR.

## Architecture

### Components

1. **YOLO Model** - Detects regions: Merchant, Date, Total, Time (no), Items
2. **EasyOCR** - Extracts text from detected regions
3. **Parser Logic** - Processes and structures the extracted data
4. **Backend API** - Serves parsed data to frontend
5. **Frontend UI** - Displays itemized breakdown with tax and discount

### Data Flow

```
Receipt Image → YOLO Detection → OCR → Text Processing → Structured JSON → Frontend Display
```

## Expected Output Format

The YOLO parser returns data in this structure:

```json
{
  "items": [
    {"product": "Organic Bananas", "price": 4.99},
    {"product": "Milk", "price": 5.99}
  ],
  "name": "Whole Foods Market",
  "total": 78.45,
  "date": "2024-01-24",
  "time": "14:30:00",
  "discount": 0.0,
  "tax": 7.50
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `ultralytics==8.0.196` - YOLO framework
- `easyocr==1.7.0` - OCR engine
- `opencv-python==4.8.1.78` - Image processing
- `matplotlib==3.8.0` - For visualization (optional)

### 2. Place Your YOLO Model

Put your trained `best.pt` YOLO model file in the backend directory:

```
backend/
  models/
    best.pt          # Your trained YOLO weights
```

Or place it anywhere and specify the full path.

### 3. Configure Environment

Edit `backend/.env`:

```env
YOLO_MODEL_PATH=models/best.pt
# Or use absolute path:
# YOLO_MODEL_PATH=D:/path/to/your/best.pt
```

### 4. Verify Class Names

Ensure your YOLO model was trained with these class names (in order):
1. Merchant
2. date
3. total
4. no (time/receipt number)
5. item

If your classes are different, update `CLASS_NAMES` in [routers/yolo_parser.py](backend/routers/yolo_parser.py#L15):

```python
CLASS_NAMES = ["YourClass1", "YourClass2", ...]
```

## How It Works

### Detection Phase

1. **YOLO processes the image** and detects bounding boxes for:
   - Merchant name
   - Date
   - Total amount
   - Time/Receipt number
   - Individual line items

2. **Each detected region is cropped** from the original image

### OCR Phase

3. **EasyOCR reads text** from each cropped region
4. **Text is concatenated** from all OCR detections within each box

### Processing Phase

5. **Date parsing** - Extracts dates in formats like:
   - `18/10/18`, `18-10-2018`, `2018-10-18`

6. **Time parsing** - Extracts times like:
   - `14:30`, `14:30:00`

7. **Item parsing** - For each item:
   - Extracts product name
   - Identifies price (rightmost number or largest value)
   - Cleans product name (removes numbers, units, symbols)

8. **Total calculation** - Validates and adjusts:
   - Compares detected total with sum of items
   - Calculates tax if total > items sum
   - Calculates discount if total < items sum
   - Applies sanity checks (rejects if total > 10x items sum)

9. **Fallback dates** - Uses current date/time if not detected

## API Endpoints

### POST /api/parse/receipt

**Request:**
```
Content-Type: multipart/form-data
file: <image_file>
```

**Response:**
```json
{
  "merchant": "Whole Foods Market",
  "amount": 78.45,
  "category": "Groceries",
  "date": "2024-01-24T00:00:00",
  "description": "Receipt from Whole Foods Market (7 items) + Tax: $7.50",
  "confidence": 0.8,
  "items": [
    {"product": "Organic Bananas", "price": 4.99},
    {"product": "Milk", "price": 5.99}
  ],
  "tax": 7.50,
  "discount": 0.0,
  "time": "14:30:00"
}
```

## Frontend Display

The frontend shows:
- ✅ Receipt image preview
- ✅ Extracted merchant, amount, date, category
- ✅ Itemized list with product names and prices
- ✅ Subtotal calculation
- ✅ Tax and discount breakdown
- ✅ Final total
- ✅ Confidence score
- ✅ Edit capability before saving

## Training Your YOLO Model

### Dataset Preparation

1. **Collect receipt images** (100-500+ images recommended)

2. **Annotate using tools** like:
   - Roboflow
   - LabelImg
   - CVAT

3. **Label regions**:
   - Merchant: Store/restaurant name
   - date: Date text
   - total: Total amount line
   - no: Time or receipt number
   - item: Each line item (product + price)

### Training

```python
from ultralytics import YOLO

# Load a pretrained model
model = YOLO('yolov8n.pt')

# Train
results = model.train(
    data='receipt_dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16
)

# Export best weights
# Model saves to runs/detect/train/weights/best.pt
```

### Dataset YAML Format

```yaml
train: path/to/train/images
val: path/to/val/images
nc: 5  # number of classes
names: ['Merchant', 'date', 'total', 'no', 'item']
```

## Customization

### Adjust OCR Language

Edit [routers/yolo_parser.py](backend/routers/yolo_parser.py#L22):

```python
_reader = easyocr.Reader(['en', 'es', 'fr'])  # Multiple languages
```

### Modify Date/Time Patterns

Add custom patterns in [yolo_parser.py](backend/routers/yolo_parser.py#L25-L35):

```python
DATE_PATTERNS = [
    r"(\d{2}[/-]\d{2}[/-]\d{2,4})",
    r"your-custom-pattern"
]
```

### Category Inference

Customize merchant-to-category mapping in [parser_router.py](backend/routers/parser_router.py#L382):

```python
category_keywords = {
    "Food & Dining": ["restaurant", "cafe", "your", "keywords"],
    "Your Category": ["keyword1", "keyword2"]
}
```

## Troubleshooting

### Model Not Loading

**Error:** `Model file not found`

**Solutions:**
1. Check `YOLO_MODEL_PATH` in `.env`
2. Verify file exists at specified path
3. Use absolute path if relative path fails
4. Check file permissions

### OCR Not Detecting Text

**Issue:** Empty or missing fields

**Solutions:**
1. Ensure receipt image is clear and high-quality
2. Check lighting - avoid glare and shadows
3. Increase image resolution (640px+)
4. Preprocess image (enhance contrast, sharpen)

### Incorrect Item Prices

**Issue:** Wrong prices extracted

**Solutions:**
1. Improve YOLO item detection accuracy (more training data)
2. Adjust number extraction logic in `parse_line_item()`
3. Use receipt templates with consistent formatting
4. Review OCR text output for accuracy

### High Memory Usage

**Issue:** Server using too much RAM

**Solutions:**
1. Use smaller YOLO model (yolov8n instead of yolov8x)
2. Resize images before processing
3. Implement image batch processing
4. Add memory limits in deployment

### Slow Processing

**Issue:** Takes too long to parse

**Solutions:**
1. Use GPU acceleration (CUDA)
2. Reduce image size
3. Use lightweight YOLO model
4. Cache OCR reader initialization
5. Implement async processing queue

## Performance Optimization

### GPU Acceleration

Install CUDA-enabled PyTorch:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

YOLO will automatically use GPU if available.

### Image Preprocessing

Add preprocessing before YOLO:

```python
import cv2

# Resize large images
max_size = 1280
if img.shape[0] > max_size or img.shape[1] > max_size:
    scale = max_size / max(img.shape[0], img.shape[1])
    img = cv2.resize(img, None, fx=scale, fy=scale)
```

### Caching

The OCR reader is lazy-loaded and cached:

```python
# Only initialized once
_reader = None

def get_ocr_reader():
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(['en'])
    return _reader
```

## Testing

### Test with Sample Images

Place test receipts in `backend/` directory:

```python
# In Python terminal
from routers.yolo_parser import detect_and_extract

with open('test_receipt.jpg', 'rb') as f:
    result = detect_and_extract('models/best.pt', f.read())
    print(result)
```

### API Testing

```bash
curl -X POST http://localhost:8000/api/parse/receipt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

## Best Practices

### For Users

1. **Clean receipts** - Flatten crumpled receipts
2. **Good lighting** - Natural light or bright indoor lighting
3. **Steady capture** - Hold device still, avoid motion blur
4. **Full receipt** - Capture entire receipt including bottom
5. **Contrast** - Place on contrasting background (dark receipt on white surface)

### For Developers

1. **Error handling** - Always have fallback parsing
2. **Validation** - Verify totals match items sum
3. **Logging** - Log parsing results for debugging
4. **User feedback** - Show confidence scores
5. **Allow editing** - Let users correct mistakes

## Security Considerations

1. **File size limits** - Enforce max upload size (5MB)
2. **File type validation** - Only accept images
3. **Sanitize output** - Clean extracted text
4. **Rate limiting** - Limit API calls per user
5. **Model security** - Protect YOLO weights file

## Future Enhancements

- [ ] Multi-language support
- [ ] Batch receipt processing
- [ ] Receipt categorization
- [ ] Duplicate detection
- [ ] Receipt storage and search
- [ ] Historical receipt analysis
- [ ] Mobile app integration
- [ ] Cloud OCR fallback (Google Vision, AWS Textract)
- [ ] Training data augmentation
- [ ] Active learning for model improvement

## Support Resources

- **YOLO Documentation**: https://docs.ultralytics.com/
- **EasyOCR Documentation**: https://github.com/JaidedAI/EasyOCR
- **OpenCV Documentation**: https://docs.opencv.org/

## Example Output

```json
{
  "items": [
    {"product": "Organic Bananas", "price": 4.99},
    {"product": "Almond Milk", "price": 5.99},
    {"product": "Whole Grain Bread", "price": 3.50},
    {"product": "Free Range Eggs", "price": 6.99},
    {"product": "Mixed Vegetables", "price": 12.99},
    {"product": "Fresh Fruits", "price": 15.50},
    {"product": "Organic Chicken", "price": 18.49}
  ],
  "name": "Whole Foods Market",
  "total": 78.45,
  "date": "2024-01-24",
  "time": "14:30:15",
  "discount": 0.0,
  "tax": 10.00,
  "merchant": "Whole Foods Market",
  "amount": 78.45,
  "category": "Groceries",
  "description": "Receipt from Whole Foods Market (7 items) + Tax: $10.00",
  "confidence": 0.8
}
```

## Contact & Support

For issues or questions about YOLO receipt parsing:
1. Check backend logs for error details
2. Verify model path configuration
3. Test with sample receipts
4. Review YOLO detection accuracy
5. Check OCR output quality

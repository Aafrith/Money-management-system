# SMS Webhook Integration - User-Specific Setup

## Summary of Changes

### Backend Changes

#### 1. **Config** (`backend/config.py`)
- Added `TEXTBEE_WEBHOOK_SECRET` (now optional - stored per-user)
- Added `SMS_DEFAULT_CATEGORY` setting

#### 2. **Models** (`backend/models.py`)
- Added `WebhookConfig` model
- Added `WebhookResponse` model
- Updated `UserResponse` to include:
  - `webhook_enabled: bool`
  - `webhook_last_received: Optional[datetime]`

#### 3. **Webhook Router** (`backend/routers/webhook_router.py`)
- New endpoint: `POST /webhooks/sms/{user_id}`
- User-specific webhook with HMAC-SHA256 signature verification
- Automatic expense creation from SMS
- Updates user's `webhook_last_received` timestamp

#### 4. **User Router** (`backend/routers/user_router.py`)
- Added `GET /api/users/me/webhook` - Get webhook config
- Added `POST /api/users/me/webhook` - Manage webhook (generate/disable)
- Secret generation using Python's `secrets` module
- User stores: `webhook_secret`, `webhook_enabled`, `webhook_created_at`

#### 5. **Main App** (`backend/main.py`)
- Registered webhook router without `/api` prefix
- Webhook accessible at: `/webhooks/sms/{user_id}`

### Frontend Changes

#### 1. **Services** (`frontend/src/services/index.js`)
- Added webhook methods to `userService`:
  - `getWebhook()` - Fetch user's webhook config
  - `generateWebhookSecret()` - Generate new secret
  - `disableWebhook()` - Disable webhook

#### 2. **Settings Page** (`frontend/src/pages/Settings/Settings.jsx`)
- Added SMS Webhook tab in Settings
- Features:
  - Phone number validation
  - Generate/disable webhook secret
  - Display webhook URL for textbee.dev configuration
  - Copy buttons for URL and secret
  - Show/hide secret toggle
  - Last received SMS timestamp
  - Step-by-step setup instructions
  - Feature list and how it works

## Setup Instructions for Users

### Step 1: Add Phone Number
- Go to Settings → Profile
- Enter your phone number
- Save changes

### Step 2: Generate Webhook Secret
- Go to Settings → SMS Webhook
- Click "Generate Webhook Secret"
- The secret will be displayed (copy and save it)

### Step 3: Configure textbee.dev
1. Go to https://textbee.dev/dashboard
2. Create a new webhook
3. Set **Delivery URL** to the URL shown in Settings (format: `https://your-domain.com/webhooks/sms/{user_id}`)
4. Set **Webhook Secret** to the secret generated in Step 2
5. Select **"Message Received"** event
6. Test the webhook

### Step 4: Receive SMS
- When SMS is received, textbee.dev sends it to your webhook
- System automatically:
  - Parses the SMS (extracts merchant, amount, category)
  - Creates expense with source "SMS"
  - Updates statistics

## Security

- Each user has their own webhook URL and secret
- HMAC-SHA256 signature verification on each webhook
- Secret is securely stored in database
- Secret displayed only once after generation
- Users can disable webhook anytime

## Testing Locally

For local testing with ngrok:

```powershell
# Terminal 1: Start backend
cd backend
python main.py

# Terminal 2: Expose with ngrok
ngrok http 8000

# Copy the https URL from ngrok output (e.g., https://abc123.ngrok.io)

# In Settings → SMS Webhook:
# The URL will be: https://abc123.ngrok.io/webhooks/sms/{user_id}
```

## Database Schema Changes

Users collection now has:
```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "phone": String,
  "webhook_enabled": Boolean,
  "webhook_secret": String,  // Only if webhook is enabled
  "webhook_created_at": DateTime,  // Only if webhook is enabled
  "webhook_last_received": DateTime,  // Updated when SMS received
  // ...other fields
}
```

## API Endpoints

### Get Webhook Config
```
GET /api/users/me/webhook
Response: { enabled: bool, url: string, last_received: datetime }
```

### Generate Webhook Secret
```
POST /api/users/me/webhook
Body: { action: "generate" }
Response: { status: "success", secret: string, ... }
```

### Disable Webhook
```
POST /api/users/me/webhook
Body: { action: "disable" }
Response: { status: "success", ... }
```

### Receive SMS (textbee.dev)
```
POST /webhooks/sms/{user_id}
Headers: { x-signature: string }
Body: { 
  smsId: string,
  sender: string,
  message: string,
  receivedAt: string,
  deviceId: string,
  webhookEvent: "MESSAGE_RECEIVED"
}
Response: { 
  status: "success",
  expense_id: string,
  amount: float,
  merchant: string
}
```

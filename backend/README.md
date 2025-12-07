# Money Management System - Backend

FastAPI backend for the Money Management System with MongoDB Atlas integration.

## Features

- 🔐 JWT-based authentication
- 👤 User management (registration, login, profile)
- 💰 Expense tracking and management
- 📊 Category management
- 📈 Dashboard statistics and analytics
- 🤖 Intelligent expense parsing (SMS, Receipt, Voice)
- 👨‍💼 Admin panel with user management
- 🔒 Role-based access control
- 📱 RESTful API design

## Tech Stack

- **FastAPI** - Modern Python web framework
- **MongoDB Atlas** - Cloud database
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration (MongoDB URI is already set).

3. Run the server:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/{id}` - Get expense by ID
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `GET /api/expenses/stats` - Get expense statistics

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Parsers
- `POST /api/parse/sms` - Parse expense from SMS text
- `POST /api/parse/receipt` - Parse expense from receipt image
- `POST /api/parse/voice` - Parse expense from voice recording

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/{id}` - Get user details
- `PATCH /api/admin/users/{id}` - Update user status/role
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/users/{id}/expenses` - Get user expenses

### User Profile
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `POST /api/users/me/change-password` - Change password
- `DELETE /api/users/me` - Delete account

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

```env
MONGODB_URL=mongodb+srv://moneymanage:moneymanage@moneymanage.ss0cqfw.mongodb.net/
DATABASE_NAME=moneymanagement
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
FRONTEND_URL=http://localhost:5173
```

## Database Schema

### Users Collection
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `phone`: String (optional)
- `role`: Enum (user, admin)
- `status`: Enum (active, inactive, suspended)
- `created_at`: DateTime
- `last_active`: DateTime
- `avatar`: String (optional)

### Expenses Collection
- `_id`: ObjectId
- `user_id`: String (reference)
- `merchant`: String
- `amount`: Float
- `category`: String
- `date`: DateTime
- `description`: String (optional)
- `source`: Enum (manual, sms, receipt, voice)
- `created_at`: DateTime
- `updated_at`: DateTime

### Categories Collection
- `_id`: ObjectId
- `user_id`: String (reference)
- `name`: String
- `color`: String (hex color)
- `icon`: String (emoji)
- `created_at`: DateTime
- `count`: Integer (expense count)

## Default Demo Accounts

### User Account
- Email: user@demo.com
- Password: password123

### Admin Account
- Email: admin@demo.com
- Password: admin123

## Development

Run with auto-reload:
```bash
uvicorn main:app --reload
```

## Deployment

1. Set environment variables in production
2. Change `DEBUG=False` in production
3. Use a strong `SECRET_KEY`
4. Configure proper CORS settings
5. Use HTTPS in production

## License

MIT

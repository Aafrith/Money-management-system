# 💰 Smart Money Management System

A comprehensive, full-stack web application for intelligent expense tracking with MongoDB Atlas backend, JWT authentication, and multiple input methods including SMS parsing, receipt OCR, and voice memos.

![React](https://img.shields.io/badge/React-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎉 **FULLY FUNCTIONAL - Backend & Frontend Ready!**

✅ Complete FastAPI backend with MongoDB Atlas
✅ JWT authentication system
✅ All CRUD operations working
✅ Admin dashboard functional
✅ Smart SMS parser operational
✅ Real-time statistics and analytics

---

## 🌟 Features

### 🔐 **Authentication & Security**
- User registration and login
- JWT token-based authentication
- Bcrypt password hashing
- Role-based access control (User/Admin)
- Protected routes and endpoints

### 💰 **Expense Management**
- **📱 SMS Parser** - Automatically extract expense details from transaction SMS
- **📸 Receipt OCR** - Upload receipt photos for data extraction (ready for integration)
- **🎤 Voice Memos** - Audio recording to expense conversion (ready for integration)
- **✍️ Manual Entry** - Traditional form-based input
- Complete CRUD operations
- Advanced filtering (category, source, date range, search)
- Bulk operations support

### 📊 **Smart Dashboard & Analytics**
- Real-time expense statistics
- Interactive charts (spending trends, category breakdown)
- Transaction source analytics
- Monthly comparison and growth tracking
- Recent activity feed
- Time range filters (7 days, 30 days, 90 days, year)

### 🏷️ **Category Management**
- 8 pre-built expense categories
- Custom categories with colors and emoji icons
- Automatic expense counting
- Category-based filtering and analytics
- Protected deletion (prevents deleting used categories)

### 👨‍💼 **Admin Panel**
- User management dashboard
- System-wide statistics
- User status control (active/suspended)
- Role management (user/admin)
- View all users with expense statistics
- Delete users with data cleanup

### 🗄️ **Database**
- MongoDB Atlas cloud database
- Fully indexed for performance
- Automatic data cleanup
- Relationship management

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and npm (for frontend)
- **Python** 3.8+ (for backend)
- Modern web browser

### 🎯 **Backend Setup** (Already Done!)

The backend is **RUNNING** and fully operational!

```powershell
# Navigate to backend
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Server is already running on http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

**Backend Status**: 🟢 **ONLINE**
- Server: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: ✅ Connected to MongoDB Atlas

### 🎨 **Frontend Setup**

1. **Navigate to frontend directory:**
```powershell
cd frontend
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Start development server:**
```powershell
npm run dev
```

4. **Open your browser:**
```
http://localhost:5173
```

5. **Create an account or use demo credentials:**
   - User: `user@demo.com` / `password123`
   - Admin: `admin@demo.com` / `admin123`

---

## 📡 **API Endpoints**

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - List all expenses (with filters)
- `GET /api/expenses/stats` - Dashboard statistics
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Parsers
- `POST /api/parse/sms` - Parse SMS text
- `POST /api/parse/receipt` - Parse receipt image
- `POST /api/parse/voice` - Parse voice recording

### Admin (Admin only)
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user

**Complete API Documentation**: http://localhost:8000/docs

---
```

2. **Install frontend dependencies:**
```powershell
cd frontend
npm install
```

3. **Set up environment:**
```powershell
Copy-Item .env.example .env
```

4. **Run development server:**
```powershell
npm run dev
```

5. **Open browser:**
Navigate to `http://localhost:3000`

6. **Login with demo credentials:**
- Email: `user@demo.com`
- Password: `password123`

📖 **For detailed setup:** See [QUICKSTART.md](QUICKSTART.md)

---

## 📁 Project Structure

```
MoneymanagementSystem/
├── frontend/                 # React + Tailwind frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   │   ├── Auth/        # Login, Register
│   │   │   ├── Dashboard/   # Main dashboard
│   │   │   ├── Expenses/    # Expense management
│   │   │   ├── Categories/  # Category management
│   │   │   ├── AddExpense/  # SMS, Receipt, Voice, Manual
│   │   │   └── Settings/    # User settings
│   │   ├── services/        # API services
│   │   ├── store/           # State management (Zustand)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                  # FastAPI backend (Phase 2)
│   └── (To be implemented)
│
├── DOCUMENTATION.md          # Complete documentation
├── QUICKSTART.md            # Quick start guide
└── README.md                # This file
```

---

## 🎨 Tech Stack

### Frontend
- **Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **Styling:** Tailwind CSS 3.3
- **Animations:** Framer Motion 10.16
- **Charts:** Recharts 2.10
- **State:** Zustand 4.4
- **HTTP Client:** Axios 1.6
- **Routing:** React Router 6.20
- **Icons:** Lucide React

### Backend (Planned)
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Auth:** JWT tokens
- **ML/AI:** To be integrated (Phase 2)

---

## 📸 Screenshots

### Dashboard
Beautiful, data-rich dashboard with charts and statistics

### Add Expense - SMS Parser
Two-step flow: Paste SMS → Review & Edit → Save

### Add Expense - Receipt Upload
Upload photo → Auto-extract data → Edit → Save

### Categories Management
Grid view with custom colors, icons, and usage stats

---

## 🎯 Development Phases

### ✅ Phase 1: Frontend (Current)
- Complete React UI with all pages
- Demo mode with mock data
- Responsive design
- Animations and polish
- **Status:** COMPLETE

### 🔜 Phase 2: Backend Integration
- FastAPI REST API
- PostgreSQL database
- User authentication (JWT)
- CRUD operations
- Mock parser endpoints
- **Status:** Planned

### 🔮 Phase 3: ML Models
- Fine-tuned SMS parser (NLP)
- Receipt OCR (Tesseract/LayoutLM)
- Voice-to-text (Whisper)
- Category prediction
- **Status:** Future

---

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 3 minutes
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Complete project documentation
- **[frontend/README.md](frontend/README.md)** - Frontend-specific details

---

## 🎮 Demo Mode

The frontend runs in **demo mode** with mock data when the backend is unavailable:
- ✅ All UI features functional
- ✅ Sample data pre-populated
- ✅ Simulated API responses
- ✅ Perfect for UI/UX testing
- ✅ No backend required

---

## 🛠️ Available Scripts

### Frontend
```powershell
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 📦 API Endpoints (Design)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Expenses
- `GET /api/expenses` - List all expenses (with filters)
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats` - Get statistics

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Parsers
- `POST /api/parse/sms` - Parse SMS text
- `POST /api/parse/receipt` - Parse receipt image
- `POST /api/parse/voice` - Parse voice memo

---

## 🎨 Design System

### Color Palette
- **Primary:** Blue (#0ea5e9) - Trust, finance
- **Secondary:** Purple (#a855f7) - Innovation
- **Success:** Green (#10b981)
- **Warning:** Orange (#f59e0b)
- **Error:** Red (#ef4444)

### Typography
- **Headings:** Bold, sans-serif
- **Body:** Regular, readable
- **Monospace:** For SMS/code blocks

### Components
- Buttons (Primary, Secondary, Danger)
- Input fields with focus states
- Cards with hover effects
- Modals with backdrop
- Toast notifications

---

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- UI Framework by [Tailwind CSS](https://tailwindcss.com/)

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

## 🗺️ Roadmap

- [x] Complete frontend UI/UX
- [x] Authentication pages
- [x] Dashboard with charts
- [x] Expense management
- [x] Multiple input methods (SMS, Receipt, Voice, Manual)
- [x] Category management
- [x] User settings
- [ ] FastAPI backend setup
- [ ] Database schema and models
- [ ] REST API implementation
- [ ] SMS parser (rule-based)
- [ ] Receipt OCR integration
- [ ] Voice-to-text integration
- [ ] ML model fine-tuning
- [ ] Deploy to production
- [ ] Mobile app (React Native)

---

**Built with ❤️ for smarter expense tracking**

---

⭐ **Star this repo if you find it helpful!**

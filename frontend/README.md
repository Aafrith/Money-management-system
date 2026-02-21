# Smart Money Manager - Frontend

A modern, responsive React frontend for the Smart Money Management System with automated expense tracking.

## Features

- 🔐 Authentication (Login/Register)
- 📊 Interactive Dashboard with Charts
- 💰 Expense Management with Filters
- 📱 SMS-based Expense Parsing
- 📸 Receipt Image Upload & OCR
- 🎤 Voice Memo Support
- ✏️ Manual Expense Entry
- 🏷️ Category Management
- ⚙️ User Settings & Profile
- 🎨 Beautiful UI with Tailwind CSS
- ✨ Smooth Animations with Framer Motion

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data Visualization
- **Zustand** - State Management
- **Axios** - HTTP Client
- **React Router** - Routing
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/              # Page components
│   │   ├── Auth/           # Login, Register
│   │   ├── Dashboard/      # Main dashboard
│   │   ├── Expenses/       # Expense list & management
│   │   ├── Categories/     # Category management
│   │   ├── AddExpense/     # SMS, Receipt, Voice, Manual
│   │   └── Settings/       # User settings
│   ├── services/           # API services
│   │   ├── api.js
│   │   └── index.js
│   ├── store/              # Zustand state management
│   │   └── index.js
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
npm install react-speech-recognition
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:8000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Features Overview

### Authentication
- Secure login and registration
- Protected routes
- JWT token management
- Demo credentials provided

### Dashboard
- Total expenses overview
- Transaction count
- Category breakdown (Pie chart)
- Spending trend (Area chart)
- Input source statistics
- Recent transactions

### Expense Management
- List all expenses with filtering
- Search by merchant/description
- Filter by category, source, date range
- Edit and delete expenses
- Export functionality

### Add Expense Methods

#### 1. SMS Parser
- Paste bank SMS text
- Automatic parsing of amount, merchant, date
- Review and edit before saving
- Sample SMS templates provided

#### 2. Receipt Upload
- Upload receipt images
- OCR-based data extraction (backend)
- Image preview
- Item-level breakdown
- Edit extracted data

#### 3. Voice Memo
- Upload audio files or type text
- Speech-to-text conversion (backend)
- Natural language processing
- Transcription display

#### 4. Manual Entry
- Traditional form input
- All expense fields
- Quick and simple

### Categories
- Create custom categories
- Assign colors and icons
- Track usage statistics
- Edit and delete categories

### Settings
- Profile management
- Notification preferences
- Appearance customization
- Data export
- Privacy controls

## Demo Mode

The frontend works in demo mode with mock data when the backend is not available. This allows you to:
- Test all UI features
- See sample data and interactions
- Understand the complete flow
- Demo to stakeholders

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```js
colors: {
  primary: { ... },
  secondary: { ... },
}
```

### Animations
Adjust animation timings in `tailwind.config.js`:
```js
animation: {
  'fade-in': 'fadeIn 0.5s ease-in-out',
  ...
}
```

## API Integration

The app expects the following API endpoints:

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
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

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Lazy loading for routes
- Optimized images
- Minimal bundle size
- Fast initial load

## Contributing

1. Follow the existing code style
2. Use meaningful component and variable names
3. Add comments for complex logic
4. Test on multiple screen sizes

## License

MIT License

---

Built with ❤️ using React and Tailwind CSS

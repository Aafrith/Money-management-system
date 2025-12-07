import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuthStore } from './store';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// User Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Expenses from './pages/Expenses/Expenses';
import Categories from './pages/Categories/Categories';
import Settings from './pages/Settings/Settings';
import UserProfile from './pages/User/UserProfile';

// Add Expense Pages
import AddSMS from './pages/AddExpense/AddSMS';
import AddReceipt from './pages/AddExpense/AddReceipt';
import AddVoice from './pages/AddExpense/AddVoice';
import AddManual from './pages/AddExpense/AddManual';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminAnalytics from './pages/Admin/AdminAnalytics';

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Apply theme class to html element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#363636',
            color: '#fff',
            borderRadius: '10px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* User Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="categories" element={<Categories />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<UserProfile />} />
          
          {/* Add Expense Routes */}
          <Route path="add/sms" element={<AddSMS />} />
          <Route path="add/receipt" element={<AddReceipt />} />
          <Route path="add/voice" element={<AddVoice />} />
          <Route path="add/manual" element={<AddManual />} />
          
          {/* Admin Routes */}
          <Route 
            path="admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/users" 
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/settings" 
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/analytics" 
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            } 
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

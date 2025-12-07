import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Wallet,
  MessageSquare,
  Image,
  Mic,
  ChevronDown,
  Shield,
  Users,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../store';
import ThemeToggle from './ThemeToggle';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Close menus when route changes
  useEffect(() => {
    setIsMobileOpen(false);
    setIsAddMenuOpen(false);
  }, [location.pathname]);

  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Categories', path: '/categories', icon: Tag },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: Shield },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Admin Settings', path: '/admin/settings', icon: Settings },
  ];

  const addMenuItems = [
    { name: 'SMS', path: '/add/sms', icon: MessageSquare, color: 'text-blue-600' },
    { name: 'Receipt', path: '/add/receipt', icon: Image, color: 'text-green-600' },
    { name: 'Voice', path: '/add/voice', icon: Mic, color: 'text-purple-600' },
    { name: 'Manual', path: '/add/manual', icon: Plus, color: 'text-orange-600' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.path);
    
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          active
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={(e) => {
          setIsMobileOpen(false);
          setIsAddMenuOpen(false);
          // If already on this page, force a refresh
          if (active) {
            e.preventDefault();
            navigate(item.path, { replace: true });
          }
        }}
      >
        <item.icon className="w-5 h-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Money Manager</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              {isAdmin && <Shield className="w-3 h-3" />}
              {user?.role || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Admin Panel
            </div>
            {adminNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
            <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              User Panel
            </div>
          </>
        )}

        {/* User Navigation */}
        {userNavItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}

        {/* Add Expense Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <span>Add Expense</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isAddMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          <AnimatePresence>
            {isAddMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-4 mt-1 space-y-1 overflow-hidden"
              >
                {addMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-gray-100 dark:bg-gray-800 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setIsMobileOpen(false);
                      setIsAddMenuOpen(false);
                    }}
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isAdmin && (
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive('/settings')
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => {
              setIsMobileOpen(false);
              setIsAddMenuOpen(false);
            }}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Theme Control */}
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>

        <Link
          to="/profile"
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => {
            setIsMobileOpen(false);
            setIsAddMenuOpen(false);
          }}
        >
          <div className={`w-10 h-10 ${isAdmin ? 'bg-purple-200 dark:bg-purple-900' : 'bg-primary-200 dark:bg-primary-900'} rounded-full flex items-center justify-center`}>
            {isAdmin ? (
              <Shield className="w-5 h-5 text-purple-700 dark:text-purple-300" />
            ) : (
              <User className="w-5 h-5 text-primary-700 dark:text-primary-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">Money Manager</span>
              {isAdmin && (
                <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">Admin</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {isMobileOpen ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

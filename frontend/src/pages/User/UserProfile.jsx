import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, Shield, Edit, Camera,
  DollarSign, Receipt, TrendingUp, Award, Target
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { userService, expenseService } from '../../services';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

const UserProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || null,
  });
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    avgPerMonth: 0,
    categoriesUsed: 0,
    streakDays: 0,
    savingsGoal: 50000,
    currentSavings: 0,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || null,
      });
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const [expensesData, dashStats] = await Promise.all([
        expenseService.getAll(),
        expenseService.getStats('30days')
      ]);
      
      const totalExpenses = expensesData.length;
      const totalAmount = dashStats.total_amount || 0;
      const avgPerMonth = totalAmount / (totalExpenses > 0 ? 1 : 1);
      const categoriesUsed = new Set(expensesData.map(e => e.category)).size;
      
      setStats({
        totalExpenses,
        totalAmount,
        avgPerMonth: avgPerMonth,
        categoriesUsed,
        streakDays: 45, // TODO: Calculate actual streak
        savingsGoal: 50000,
        currentSavings: dashStats.total_amount * 0.15 || 0, // 15% savings estimate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    if (!profileData.name) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const updated = await userService.updateProfile({
        name: profileData.name,
        phone: profileData.phone || null,
      });
      
      updateUser(updated);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
      toast.success('Avatar uploaded!');
    }
  };

  const savingsProgress = (stats.currentSavings / stats.savingsGoal) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {profileData.name.charAt(0)}
                  </div>
                )}
                
                <label className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{profileData.email}</p>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                {user?.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{profileData.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Joined Jan 2024</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              <Edit className="w-5 h-5" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Stats & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    className="input-field bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    readOnly
                    title="Email cannot be changed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email address cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="input-field"
                    placeholder="+1234567890"
                  />
                </div>
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalExpenses}</p>
                </div>
                <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total Amount</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Monthly Avg</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.avgPerMonth)}</p>
                </div>
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Streak Days</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.streakDays} 🔥</p>
                </div>
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 dark:text-orange-400 flex-shrink-0 ml-2" />
              </div>
            </div>
          </div>

          {/* Savings Goal */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Savings Goal
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Current Savings</span>
                <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.currentSavings)}</span>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{savingsProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all"
                    style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Goal</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.savingsGoal)}</span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                💡 You need to save <span className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency((stats.savingsGoal - stats.currentSavings))}</span> more to reach your goal!
              </p>
            </div>
          </div>

          {/* Achievements */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievements
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="font-semibold text-gray-900 dark:text-white">First Expense</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Added your first expense</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="font-semibold text-gray-900 dark:text-white">Data Master</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Tracked 100+ expenses</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <div className="text-4xl mb-2">💰</div>
                <p className="font-semibold text-gray-900 dark:text-white">Budget Pro</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Under budget 3 months</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-center">
                <div className="text-4xl mb-2">🔥</div>
                <p className="font-semibold text-gray-900 dark:text-white">Streak Master</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">45-day tracking streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProfile;

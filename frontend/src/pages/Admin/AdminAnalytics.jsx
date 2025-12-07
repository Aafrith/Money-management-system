import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Users, Receipt, Calendar,
  ArrowUp, ArrowDown, BarChart3
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';
import { adminService } from '../../services';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dashboardData = await adminService.getDashboard();
      
      // Generate mock analytics data based on real stats
      const analyticsData = {
        ...dashboardData,
        
        // Revenue trends
        revenueTrend: [
          { month: 'Jan', revenue: Math.floor(dashboardData.totalAmount * 0.12), expenses: Math.floor(dashboardData.totalExpenses * 0.11) },
          { month: 'Feb', revenue: Math.floor(dashboardData.totalAmount * 0.14), expenses: Math.floor(dashboardData.totalExpenses * 0.13) },
          { month: 'Mar', revenue: Math.floor(dashboardData.totalAmount * 0.15), expenses: Math.floor(dashboardData.totalExpenses * 0.15) },
          { month: 'Apr', revenue: Math.floor(dashboardData.totalAmount * 0.16), expenses: Math.floor(dashboardData.totalExpenses * 0.17) },
          { month: 'May', revenue: Math.floor(dashboardData.totalAmount * 0.18), expenses: Math.floor(dashboardData.totalExpenses * 0.19) },
          { month: 'Jun', revenue: Math.floor(dashboardData.totalAmount * 0.25), expenses: Math.floor(dashboardData.totalExpenses * 0.25) },
        ],
        
        // User activity by day
        dailyActivity: [
          { day: 'Mon', users: Math.floor(dashboardData.activeUsers * 0.85) },
          { day: 'Tue', users: Math.floor(dashboardData.activeUsers * 0.90) },
          { day: 'Wed', users: Math.floor(dashboardData.activeUsers * 0.88) },
          { day: 'Thu', users: Math.floor(dashboardData.activeUsers * 0.92) },
          { day: 'Fri', users: Math.floor(dashboardData.activeUsers * 0.95) },
          { day: 'Sat', users: Math.floor(dashboardData.activeUsers * 0.70) },
          { day: 'Sun', users: Math.floor(dashboardData.activeUsers * 0.65) },
        ],
        
        // Category distribution
        categoryDistribution: [
          { name: 'Food & Dining', value: 35, color: '#3b82f6' },
          { name: 'Transportation', value: 25, color: '#8b5cf6' },
          { name: 'Shopping', value: 20, color: '#ec4899' },
          { name: 'Entertainment', value: 12, color: '#f59e0b' },
          { name: 'Others', value: 8, color: '#10b981' },
        ],
        
        // Top users by expenses
        topUsers: [],
      };
      
      // Fetch top users
      try {
        const usersData = await adminService.getUsers({ limit: 5 });
        analyticsData.topUsers = usersData
          .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
          .slice(0, 5);
      } catch (error) {
        console.error('Failed to fetch top users:', error);
      }
      
      setStats(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
            Analytics & Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Detailed insights and trends</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalAmount)}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`flex items-center text-sm ${stats.expenseGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.expenseGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(stats.expenseGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`flex items-center text-sm ${stats.userGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.userGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(stats.userGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Transactions</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalExpenses.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg: {(stats.totalAmount / stats.totalExpenses).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Receipt className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-green-600 dark:text-green-400">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% active
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue & Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#8b5cf6" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Active Users</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" name="Active Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                label
              >
                {stats.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {stats.categoryDistribution.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Users by Spending</h3>
          <div className="space-y-3">
            {stats.topUsers.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(user.totalAmount || 0)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.expenses || 0} transactions</p>
                </div>
              </div>
            ))}
            {stats.topUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No user data available
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;

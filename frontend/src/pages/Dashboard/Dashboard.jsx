import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MessageSquare,
  Image,
  Mic,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useExpenseStore, useCategoryStore } from '../../store';
import { expenseService, categoryService } from '../../services';
import toast from 'react-hot-toast';
import { format, subDays, parseISO } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const expenses = useExpenseStore((state) => state.expenses);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, expenses.length]); // Re-fetch when expenses change

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const expenseStats = await expenseService.getStats({ range: timeRange });
      
      // Backend already returns the correct structure with camelCase
      // Just need to map icons for source breakdown
      const mappedStats = {
        ...expenseStats,
        sourceBreakdown: (expenseStats.sourceBreakdown || []).map(src => {
          const iconMap = {
            SMS: MessageSquare,
            RECEIPT: Image,
            VOICE: Mic,
            MANUAL: PlusCircle
          };
          return {
            ...src,
            icon: iconMap[src.name] || PlusCircle
          };
        }),
        recentTransactions: (expenseStats.recentTransactions || []).map(exp => ({
          ...exp,
          _id: exp.id,
          merchant: exp.merchant || 'N/A'
        }))
      };
      
      setStats(mappedStats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getMockStats = () => ({
    totalExpenses: 12450.50,
    monthlyChange: 12.5,
    transactionCount: 87,
    categoryBreakdown: [
      { name: 'Food & Dining', value: 3500, color: '#0ea5e9' },
      { name: 'Transportation', value: 2200, color: '#a855f7' },
      { name: 'Shopping', value: 1800, color: '#f59e0b' },
      { name: 'Entertainment', value: 1500, color: '#10b981' },
      { name: 'Bills & Utilities', value: 2000, color: '#ef4444' },
      { name: 'Others', value: 1450.50, color: '#6b7280' },
    ],
    sourceBreakdown: [
      { name: 'SMS', value: 45, icon: MessageSquare, color: 'bg-blue-500' },
      { name: 'Receipt', value: 25, icon: Image, color: 'bg-green-500' },
      { name: 'Voice', value: 10, icon: Mic, color: 'bg-purple-500' },
      { name: 'Manual', value: 7, icon: PlusCircle, color: 'bg-orange-500' },
    ],
    trendData: Array.from({ length: 7 }, (_, i) => ({
      date: format(subDays(new Date(), 6 - i), 'MMM dd'),
      amount: Math.floor(Math.random() * 500) + 200,
    })),
    recentTransactions: [
      {
        id: 1,
        merchant: 'Starbucks',
        amount: 12.50,
        category: 'Food & Dining',
        date: new Date(),
        source: 'sms',
      },
      {
        id: 2,
        merchant: 'Uber',
        amount: 25.00,
        category: 'Transportation',
        date: subDays(new Date(), 1),
        source: 'receipt',
      },
      {
        id: 3,
        merchant: 'Amazon',
        amount: 89.99,
        category: 'Shopping',
        date: subDays(new Date(), 2),
        source: 'voice',
      },
      {
        id: 4,
        merchant: 'Netflix',
        amount: 15.99,
        category: 'Entertainment',
        date: subDays(new Date(), 3),
        source: 'manual',
      },
    ],
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400 mb-4">No data available</p>
        <p className="text-sm text-gray-500">Start by adding your first expense!</p>
      </div>
    );
  }

  const data = stats;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your expense overview.</p>
        </div>
        <div className="flex gap-2">
          {['7days', '30days', '90days'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Expenses</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${data.totalExpenses.toLocaleString()}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                {data.monthlyChange >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      +{data.monthlyChange}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      {data.monthlyChange}%
                    </span>
                  </>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Transactions</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.transactions}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This period</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg per Day</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${(data.totalExpenses / 30).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Daily average</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Top Category</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${data.categoryBreakdown && data.categoryBreakdown.length > 0 ? data.categoryBreakdown[0].value : 0}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? data.categoryBreakdown[0].name : 'No data'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.trendData || []}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#0ea5e9"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.categoryBreakdown || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data.categoryBreakdown || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Source Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Input Sources</h3>
          <div className="space-y-3">
            {(data.sourceBreakdown || []).map((source) => {
              const Icon = source.icon;
              const total = (data.sourceBreakdown || []).reduce((sum, s) => sum + s.value, 0);
              const percentage = total > 0 ? ((source.value / total) * 100).toFixed(0) : 0;
              return (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${source.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{source.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{source.value} transactions</p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants} className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <a href="/expenses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </a>
          </div>
          <div className="space-y-3">
            {(data.recentTransactions || []).map((transaction) => (
              <div
                key={transaction._id || transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-700">
                      {transaction.merchant?.charAt(0) || 'N'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.merchant || 'N/A'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{format(typeof transaction.date === 'string' ? parseISO(transaction.date) : new Date(transaction.date), 'MMM dd')}</span>
                      <span>•</span>
                      <span className="capitalize">{transaction.source}</span>
                    </div>
                  </div>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;

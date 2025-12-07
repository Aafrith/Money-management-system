import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  MessageSquare,
  Image,
  Mic,
  PlusCircle,
} from 'lucide-react';
import { expenseService, categoryService } from '../../services';
import { useExpenseStore, useCategoryStore } from '../../store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Expenses = () => {
  const { expenses, setExpenses, deleteExpense } = useExpenseStore();
  const { categories, setCategories } = useCategoryStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesData, categoriesData] = await Promise.all([
        expenseService.getAll(),
        categoryService.getAll(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load expenses: ' + (error.response?.data?.detail || error.message));
      setExpenses([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getMockExpenses = () => [
    {
      id: 1,
      merchant: 'Starbucks Coffee',
      amount: 12.50,
      category: 'Food & Dining',
      date: new Date().toISOString(),
      source: 'sms',
      description: 'Morning coffee',
    },
    {
      id: 2,
      merchant: 'Uber',
      amount: 25.00,
      category: 'Transportation',
      date: new Date(Date.now() - 86400000).toISOString(),
      source: 'receipt',
      description: 'Ride to office',
    },
    {
      id: 3,
      merchant: 'Amazon',
      amount: 89.99,
      category: 'Shopping',
      date: new Date(Date.now() - 172800000).toISOString(),
      source: 'voice',
      description: 'Electronics purchase',
    },
    {
      id: 4,
      merchant: 'Netflix',
      amount: 15.99,
      category: 'Entertainment',
      date: new Date(Date.now() - 259200000).toISOString(),
      source: 'manual',
      description: 'Monthly subscription',
    },
    {
      id: 5,
      merchant: 'Whole Foods',
      amount: 156.32,
      category: 'Food & Dining',
      date: new Date(Date.now() - 345600000).toISOString(),
      source: 'receipt',
      description: 'Weekly groceries',
    },
  ];

  const getMockCategories = () => [
    { id: 1, name: 'Food & Dining' },
    { id: 2, name: 'Transportation' },
    { id: 3, name: 'Shopping' },
    { id: 4, name: 'Entertainment' },
    { id: 5, name: 'Bills & Utilities' },
  ];

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await expenseService.delete(id);
      deleteExpense(id);
      fetchData(); // Refresh the list
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'receipt':
        return <Image className="w-4 h-4" />;
      case 'voice':
        return <Mic className="w-4 h-4" />;
      default:
        return <PlusCircle className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'sms':
        return 'bg-blue-100 text-blue-700';
      case 'receipt':
        return 'bg-green-100 text-green-700';
      case 'voice':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-orange-100 text-orange-700';
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesSource = filterSource === 'all' || expense.source === filterSource;
    return matchesSearch && matchesCategory && matchesSource;
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredExpenses.length} transactions • ${totalAmount.toFixed(2)} total
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/add/manual'}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="input-field"
              >
                <option value="all">All Sources</option>
                <option value="sms">SMS</option>
                <option value="receipt">Receipt</option>
                <option value="voice">Voice</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <input
                type="date"
                className="input-field"
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No expenses found. Try adjusting your filters.</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <motion.div
              key={expense._id || expense.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-700">
                      {expense.merchant.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{expense.merchant}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getSourceColor(expense.source)}`}>
                        {getSourceIcon(expense.source)}
                        {expense.source}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {expense.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </span>
                      {expense.description && (
                        <span>{expense.description}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense._id || expense.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default Expenses;

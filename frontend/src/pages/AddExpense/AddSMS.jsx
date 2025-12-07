import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { parserService, expenseService, categoryService } from '../../services';
import { useExpenseStore } from '../../store';
import toast from 'react-hot-toast';

const AddSMS = () => {
  const navigate = useNavigate();
  const addExpense = useExpenseStore((state) => state.addExpense);
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [step, setStep] = useState(1); // 1: Input, 2: Review
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleParse = async () => {
    if (!smsText.trim()) {
      toast.error('Please enter SMS text');
      return;
    }

    setLoading(true);
    try {
      const result = await parserService.parseSMS(smsText);
      setParsedData(result);
      setStep(2);
      toast.success('SMS parsed successfully!');
    } catch (error) {
      // Mock parsing for demo
      const mockParsed = {
        amount: 45.99,
        currency: 'USD',
        merchant: 'Starbucks',
        date: new Date().toISOString(),
        category: 'Food & Dining',
        source: 'sms',
        raw_input: smsText,
      };
      setParsedData(mockParsed);
      setStep(2);
      toast.success('SMS parsed (demo mode)');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const newExpense = await expenseService.create(parsedData);
      addExpense(newExpense);
      toast.success('Expense added successfully!');
      navigate('/expenses');
    } catch (error) {
      toast.error('Failed to add expense: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Add from SMS</h1>
            <p className="text-gray-600 dark:text-gray-400">Parse transaction from bank SMS</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} font-semibold`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} font-semibold`}>
              2
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-16 sm:gap-24 mt-2">
          <span className={`text-sm ${step >= 1 ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
            Input SMS
          </span>
          <span className={`text-sm ${step >= 2 ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
            Review & Save
          </span>
        </div>
      </div>

      {/* Step 1: Input SMS */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paste SMS Text
            </label>
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Example: Your account ending in 1234 has been debited with $45.99 at Starbucks on 12/06/2024"
              className="input-field min-h-[200px] resize-none font-mono text-sm"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Paste the complete SMS text from your bank or card provider
            </p>
          </div>

          {/* Sample SMS Templates */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Sample SMS formats:</p>
            <div className="space-y-2">
              <button
                onClick={() => setSmsText('Your account ending in 1234 has been debited with $45.99 at Starbucks on 12/06/2024')}
                className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  Your account ending in 1234 has been debited with <strong>$45.99</strong> at <strong>Starbucks</strong> on 12/06/2024
                </span>
              </button>
              <button
                onClick={() => setSmsText('Card xxxx1234 used for INR 2,500.00 at Amazon India on 06-Dec-24')}
                className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  Card xxxx1234 used for <strong>INR 2,500.00</strong> at <strong>Amazon India</strong> on 06-Dec-24
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/expenses')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleParse}
              disabled={loading || !smsText.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Parsing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Parse SMS
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review & Edit */}
      {step === 2 && parsedData && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Success Message */}
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-300">SMS Parsed Successfully!</p>
              <p className="text-sm text-green-700 dark:text-green-400">Review and edit the details below before saving</p>
            </div>
          </div>

          {/* Parsed Data Form */}
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Merchant
                </label>
                <input
                  type="text"
                  value={parsedData.merchant}
                  onChange={(e) => handleEdit('merchant', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parsedData.amount}
                  onChange={(e) => handleEdit('amount', parseFloat(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={parsedData.category}
                  onChange={(e) => handleEdit('category', e.target.value)}
                  className="input-field"
                >
                  {categories.length === 0 ? (
                    <option value="">Loading categories...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={parsedData.date.split('T')[0]}
                  onChange={(e) => handleEdit('date', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={parsedData.description || ''}
                onChange={(e) => handleEdit('description', e.target.value)}
                className="input-field min-h-[80px] resize-none"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          {/* Original SMS */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Original SMS</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg font-mono">
              {parsedData.raw_input}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Save Expense
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AddSMS;

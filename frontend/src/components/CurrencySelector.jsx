import { DollarSign } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const CurrencySelector = () => {
  const { currency, setCurrency } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs.' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <DollarSign className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentCurrency?.code}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => {
                    setCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    currency === curr.code ? 'bg-primary-50 dark:bg-primary-900' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{curr.symbol}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {curr.code}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {curr.name}
                      </p>
                    </div>
                  </div>
                  {currency === curr.code && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencySelector;

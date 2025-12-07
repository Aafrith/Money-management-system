import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      currency: 'USD',
      
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        // Update document class
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
      }),
      
      setTheme: (theme) => set(() => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme };
      }),
      
      setCurrency: (currency) => set({ currency }),
      
      formatCurrency: (amount) => {
        const state = useThemeStore.getState();
        const { currency } = state;
        
        const formats = {
          USD: { symbol: '$', position: 'before', decimals: 2 },
          LKR: { symbol: 'Rs.', position: 'before', decimals: 2 },
          EUR: { symbol: '€', position: 'before', decimals: 2 },
          GBP: { symbol: '£', position: 'before', decimals: 2 },
        };
        
        const format = formats[currency] || formats.USD;
        const formatted = amount.toLocaleString('en-US', {
          minimumFractionDigits: format.decimals,
          maximumFractionDigits: format.decimals,
        });
        
        return format.position === 'before' 
          ? `${format.symbol}${formatted}`
          : `${formatted}${format.symbol}`;
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on load
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);

import { useThemeStore } from '../store/themeStore';

export const formatCurrency = (amount) => {
  return useThemeStore.getState().formatCurrency(amount);
};

export const getCurrencySymbol = () => {
  const currency = useThemeStore.getState().currency;
  const symbols = {
    USD: '$',
    LKR: 'Rs.',
    EUR: '€',
    GBP: '£',
  };
  return symbols[currency] || '$';
};

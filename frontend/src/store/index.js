import { create } from 'zustand';
import { authService } from '../services';

export const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  
  login: async (email, password) => {
    const data = await authService.login(email, password);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },
  
  register: async (userData) => {
    const data = await authService.register(userData);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  updateUser: (userData) => {
    const updatedUser = { ...authService.getCurrentUser(), ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
  
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));

export const useExpenseStore = create((set) => ({
  expenses: [],
  stats: null,
  loading: false,
  
  setExpenses: (expenses) => set({ expenses }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  
  addExpense: (expense) => set((state) => ({ 
    expenses: [expense, ...state.expenses] 
  })),
  
  updateExpense: (id, updatedExpense) => set((state) => ({
    expenses: state.expenses.map((exp) => 
      (exp._id === id || exp.id === id) ? { ...exp, ...updatedExpense } : exp
    ),
  })),
  
  deleteExpense: (id) => set((state) => ({
    expenses: state.expenses.filter((exp) => exp._id !== id && exp.id !== id),
  })),
}));

export const useCategoryStore = create((set) => ({
  categories: [],
  
  setCategories: (categories) => set({ categories }),
  
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category],
  })),
  
  updateCategory: (id, updatedCategory) => set((state) => ({
    categories: state.categories.map((cat) =>
      (cat._id === id || cat.id === id) ? { ...cat, ...updatedCategory } : cat
    ),
  })),
  
  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter((cat) => cat._id !== id && cat.id !== id),
  })),
}));

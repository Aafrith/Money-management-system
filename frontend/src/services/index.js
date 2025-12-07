import api from './api';

// Demo credentials
const DEMO_USERS = {
  'user@demo.com': { 
    password: 'password123', 
    role: 'user',
    user: {
      id: '1',
      name: 'Demo User',
      email: 'user@demo.com',
      role: 'user',
      phone: '+1234567890',
      avatar: null,
    }
  },
  'admin@demo.com': { 
    password: 'admin123', 
    role: 'admin',
    user: {
      id: '2',
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'admin',
      phone: '+1234567891',
      avatar: null,
    }
  },
};

export const authService = {
  login: async (email, password) => {
    try {
      // Try real API first
      const response = await api.post('/auth/login', { email, password });
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { token: response.data.access_token, user: response.data.user };
      }
      return response.data;
    } catch (error) {
      // Fallback to demo mode
      if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
        const demoToken = `demo_token_${Date.now()}`;
        const userData = DEMO_USERS[email].user;
        localStorage.setItem('token', demoToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return { token: demoToken, user: userData };
      }
      throw new Error('Invalid credentials');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { token: response.data.access_token, user: response.data.user };
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  },
};

export const expenseService = {
  getAll: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  update: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get('/expenses/stats', { params });
    return response.data;
  },
};

export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  create: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  update: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export const parserService = {
  parseSMS: async (smsText) => {
    const response = await api.post('/parse/sms', { text: smsText });
    return response.data;
  },

  parseReceipt: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const response = await api.post('/parse/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  parseVoice: async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    const response = await api.post('/parse/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/users/me', userData);
    // Update localStorage with new user data
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/users/me/change-password', passwordData);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/users/me');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  },
};

export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.patch(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getUserExpenses: async (userId, params = {}) => {
    const response = await api.get(`/admin/users/${userId}/expenses`, { params });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await api.patch('/admin/settings', settingsData);
    return response.data;
  },

  resetSettings: async () => {
    const response = await api.post('/admin/settings/reset');
    return response.data;
  },
};

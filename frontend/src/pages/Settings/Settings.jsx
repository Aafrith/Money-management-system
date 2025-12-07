import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Bell, Palette, Database, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
  ];

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      const updated = await userService.updateProfile({
        name: formData.name,
        phone: formData.phone || null,
      });
      
      // Update Zustand store
      updateUser(updated);
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.current_password || !passwordData.new_password) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Sidebar */}
        <div className="card lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="card lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Profile Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your personal details</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-primary-200 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-700" />
                </div>
                <button className="btn-secondary">Change Avatar</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    className="input-field bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    readOnly
                    title="Email cannot be changed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email address cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setActiveTab('security')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Security Settings</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your password and security preferences</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="input-field"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="input-field"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="input-field"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: '',
                    })}
                    className="btn-secondary"
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Notifications</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage how you receive notifications</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Email Notifications', desc: 'Receive email updates about your expenses' },
                  { title: 'SMS Alerts', desc: 'Get text messages for large transactions' },
                  { title: 'Push Notifications', desc: 'Receive notifications in your browser' },
                  { title: 'Weekly Summary', desc: 'Get a weekly report of your spending' },
                  { title: 'Budget Alerts', desc: 'Notify when approaching budget limits' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input type="checkbox" className="sr-only peer" defaultChecked={index < 3} />
                      <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customize how the app looks</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Currency
                </label>
                <div className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed">
                  Sri Lankan Rupees (Rs.)
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">System default currency</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Date Format
                </label>
                <select className="input-field">
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Data & Privacy</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your data and privacy settings</p>
              </div>

              <div className="space-y-4">
                <button className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors">
                  <p className="font-medium text-blue-900">Export Your Data</p>
                  <p className="text-sm text-blue-700">Download all your expense data</p>
                </button>

                <button className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-colors">
                  <p className="font-medium text-yellow-900">Clear Cache</p>
                  <p className="text-sm text-yellow-700">Clear temporary data and cache</p>
                </button>

                <button className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-left hover:bg-red-100 transition-colors">
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-700">Permanently delete your account and data</p>
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Your data is encrypted and stored securely. We never share your personal
                  information with third parties. Read our{' '}
                  <a href="#" className="text-primary-600 hover:underline">
                    Privacy Policy
                  </a>{' '}
                  for more details.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="card">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout from Account
        </button>
      </div>
    </motion.div>
  );
};

export default Settings;

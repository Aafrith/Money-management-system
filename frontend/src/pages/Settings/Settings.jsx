import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Bell, Palette, Database, LogOut, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState(null);
  const [webhookSecret, setWebhookSecret] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [smsLogs, setSmsLogs] = useState([]);
  const [loadingSmsLogs, setLoadingSmsLogs] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
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
      // Load webhook config
      loadWebhookConfig();
    }
  }, [user]);

  const loadWebhookConfig = async () => {
    try {
      const config = await userService.getWebhook();
      setWebhookConfig(config);
    } catch (error) {
      console.error('Failed to load webhook config:', error);
    }
  };

  const loadSmsLogs = async () => {
    try {
      setLoadingSmsLogs(true);
      const data = await userService.getSMSLogs(20);
      setSmsLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load SMS logs:', error);
    } finally {
      setLoadingSmsLogs(false);
    }
  };

  const loadDebugInfo = async () => {
    try {
      setLoadingDebug(true);
      const data = await userService.getWebhookDebug();
      setDebugInfo(data);
    } catch (error) {
      console.error('Failed to load debug info:', error);
      toast.error('Failed to load webhook debug info');
    } finally {
      setLoadingDebug(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'sms', name: 'SMS Webhook', icon: MessageSquare },
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
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'sms') {
                      loadSmsLogs();
                      loadDebugInfo();
                    }
                  }}
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

          {/* SMS Webhook Tab */}
          {activeTab === 'sms' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">SMS Webhook Setup</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automatically create expenses from incoming SMS messages</p>
              </div>

              {/* Status Card */}
              <div className={`p-4 border rounded-lg ${
                formData.phone
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full ${
                    formData.phone ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'
                  } flex items-center justify-center flex-shrink-0`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      formData.phone ? 'bg-green-600 animate-pulse' : 'bg-yellow-600'
                    }`}></div>
                  </div>
                  <div>
                    <p className={`font-medium ${
                      formData.phone ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'
                    }`}>
                      Phone Number Required
                    </p>
                    <p className={`text-sm ${
                      formData.phone ? 'text-green-700 dark:text-green-200' : 'text-yellow-700 dark:text-yellow-200'
                    }`}>
                      {formData.phone 
                        ? `Ready for SMS webhook: ${formData.phone}` 
                        : 'Add your phone number below to enable SMS webhook'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Setup Steps */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Step-by-Step Setup</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100 font-semibold text-sm">1</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Add Phone Number</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Go to Profile section and enter your phone number. This is how we identify SMS messages for you.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100 font-semibold text-sm">2</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Generate Webhook Secret</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Click the button below to generate your unique webhook secret.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100 font-semibold text-sm">3</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Configure textbee.dev</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Go to <a href="https://textbee.dev/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">textbee.dev dashboard</a> and create webhook with the URL and secret shown below.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Secret Management */}
              {formData.phone && (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Webhook Secret</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your unique security key for textbee.dev</p>
                      </div>
                      {webhookConfig?.enabled && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-semibold rounded-full">Active</span>
                      )}
                    </div>

                    {webhookSecret ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                            {showSecret ? webhookSecret : '•'.repeat(32)}
                          </div>
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors text-sm font-medium"
                          >
                            {showSecret ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(webhookSecret);
                              toast.success('Secret copied!');
                            }}
                            className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors text-sm font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400">⚠️ Keep this secret safe and never share it publicly</p>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const result = await userService.generateWebhookSecret();
                            setWebhookSecret(result.secret);
                            setShowSecret(true);
                            toast.success('Webhook secret generated!');
                            loadWebhookConfig();
                          } catch (error) {
                            toast.error('Failed to generate secret: ' + (error.response?.data?.detail || error.message));
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                      >
                        {loading ? 'Generating...' : 'Generate Webhook Secret'}
                      </button>
                    )}
                  </div>

                  {webhookConfig?.url && webhookSecret && (
                    <>
                      <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Webhook URL for textbee.dev</p>
                        <div className="flex gap-2">
                          <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                            {webhookConfig.url}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(webhookConfig.url);
                              toast.success('URL copied!');
                            }}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-medium"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {webhookConfig?.enabled && webhookConfig?.last_received && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-100">
                            ✓ Last SMS received: {new Date(webhookConfig.last_received).toLocaleString()}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            await userService.disableWebhook();
                            setWebhookSecret(null);
                            toast.success('Webhook disabled');
                            loadWebhookConfig();
                          } catch (error) {
                            toast.error('Failed to disable webhook');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="w-full py-2 px-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                      >
                        Disable Webhook
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">How It Works</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Real-time</strong> SMS processing - expenses created instantly</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300"><strong>AI-powered</strong> parsing extracts merchant, amount & category</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Secure</strong> HMAC-SHA256 signature verification</p>
                  </div>
                </div>
              </div>

              {/* Received SMS Logs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Received SMS Messages</h3>
                  <button
                    onClick={loadSmsLogs}
                    disabled={loadingSmsLogs}
                    className="text-xs px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors disabled:opacity-50"
                  >
                    {loadingSmsLogs ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {loadingSmsLogs ? (
                  <div className="text-center py-8">
                    <div className="inline-block">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading SMS logs...</p>
                  </div>
                ) : smsLogs.length === 0 ? (
                  <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">No SMS messages received yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">SMS messages will appear here when received from textbee.dev</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {smsLogs.map((log) => (
                      <div 
                        key={log._id} 
                        className={`p-4 border rounded-lg ${
                          log.status === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                log.status === 'success'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                              }`}>
                                {log.status === 'success' ? '✓ Success' : '⚠ ' + (log.reason || 'Failed')}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(log.received_at).toLocaleString()}
                              </span>
                            </div>
                            
                            <p className={`text-sm font-medium ${
                              log.status === 'success'
                                ? 'text-green-900 dark:text-green-100'
                                : 'text-yellow-900 dark:text-yellow-100'
                            }`}>
                              From: {log.sender}
                            </p>
                            
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                              "{log.message}"
                            </p>

                            {log.status === 'success' && (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300 space-y-1">
                                <div><strong>Expense:</strong> {log.merchant} - Rs. {log.amount}</div>
                                <div><strong>Category:</strong> {log.category}</div>
                                <div><strong>ID:</strong> {log.expense_id?.substring(0, 8)}...</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debug Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Webhook Debug Info</h3>
                  <button
                    onClick={loadDebugInfo}
                    disabled={loadingDebug}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loadingDebug ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {debugInfo && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Webhook Status</p>
                        <p className={`font-semibold mt-1 ${debugInfo.webhook_enabled ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.webhook_enabled ? '✓ Enabled' : '✗ Disabled'}
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Secret</p>
                        <p className={`font-semibold mt-1 ${debugInfo.webhook_secret_set ? 'text-green-600' : 'text-yellow-600'}`}>
                          {debugInfo.webhook_secret_set ? '✓ Set' : '✗ Not Set'}
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Phone</p>
                        <p className="font-semibold mt-1 text-gray-900 dark:text-gray-100">{debugInfo.phone || 'Not set'}</p>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Total SMS</p>
                        <p className="font-semibold mt-1 text-blue-600 dark:text-blue-400">{debugInfo.total_sms_count}</p>
                      </div>
                    </div>

                    {debugInfo.webhook_last_received && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs">
                        <p className="text-green-800 dark:text-green-200">
                          <strong>Last SMS:</strong> {new Date(debugInfo.webhook_last_received).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {!debugInfo.webhook_last_received && debugInfo.webhook_enabled && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                        <p className="text-yellow-800 dark:text-yellow-200">
                          ⚠ Webhook is enabled but no SMS received yet. Check your textbee.dev configuration.
                        </p>
                      </div>
                    )}

                    {!debugInfo.webhook_enabled && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                        <p className="text-blue-800 dark:text-blue-200">
                          ℹ Webhook is disabled. Generate a secret above to enable it.
                        </p>
                      </div>
                    )}
                  </div>
                )}
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

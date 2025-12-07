import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Bell, Mail, Database, Lock, Globe, Palette,
  Server, Cloud, Key, Shield, Save, RefreshCw, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Smart Money Manager',
    supportEmail: 'support@moneymanager.com',
    allowRegistration: true,
    requireEmailVerification: true,
    enableSMSParser: true,
    enableReceiptOCR: true,
    enableVoiceInput: true,
    maxFileSize: 10,
    sessionTimeout: 30,
    passwordMinLength: 8,
    enableTwoFactor: false,
    maintenanceMode: false,
    apiRateLimit: 1000,
    databaseBackupInterval: 24,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSettings();
      setSettings(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedSettings = await adminService.updateSettings(settings);
      setSettings(updatedSettings);
      setHasChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const defaultSettings = await adminService.resetSettings();
      setSettings(defaultSettings);
      setHasChanges(false);
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleNumberChange = (key, value, min = 0, max = Infinity) => {
    const numValue = parseInt(value) || min;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    setSettings({ ...settings, [key]: clampedValue });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
          Admin Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure system settings and preferences</p>
      </div>

      {/* General Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          General Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          User Management
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Allow User Registration</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users can create new accounts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) => handleChange('allowRegistration', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Require Email Verification</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users must verify email before access</p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Two-Factor Authentication</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Require 2FA for all users</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableTwoFactor}
              onChange={(e) => handleChange('enableTwoFactor', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          Feature Toggles
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">SMS Parser</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable SMS-based expense tracking</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSMSParser}
              onChange={(e) => handleChange('enableSMSParser', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Receipt OCR</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable receipt image scanning</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableReceiptOCR}
              onChange={(e) => handleChange('enableReceiptOCR', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Voice Input</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable voice memo transcription</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableVoiceInput}
              onChange={(e) => handleChange('enableVoiceInput', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Security Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password Min Length
            </label>
            <input
              type="number"
              value={settings.passwordMinLength}
              onChange={(e) => handleNumberChange('passwordMinLength', e.target.value, 6, 20)}
              className="input-field"
              min="6"
              max="20"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum: 6, Maximum: 20 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleNumberChange('sessionTimeout', e.target.value, 5, 1440)}
              className="input-field"
              min="5"
              max="1440"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum: 5 minutes, Maximum: 24 hours
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={settings.apiRateLimit}
              onChange={(e) => handleNumberChange('apiRateLimit', e.target.value, 100, 10000)}
              className="input-field"
              min="100"
              max="10000"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recommended: 1000-5000 requests per hour
            </p>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          System Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max File Upload Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => handleNumberChange('maxFileSize', e.target.value, 1, 100)}
              className="input-field"
              min="1"
              max="100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For receipt images and voice recordings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Database Backup Interval (hours)
            </label>
            <input
              type="number"
              value={settings.databaseBackupInterval}
              onChange={(e) => handleNumberChange('databaseBackupInterval', e.target.value, 1, 168)}
              className="input-field"
              min="1"
              max="168"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recommended: 24 hours (daily backup)
            </p>
          </div>

          <label className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg cursor-pointer border border-yellow-300 dark:border-yellow-700">
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-300">Maintenance Mode</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">Disable site access for maintenance</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              className="w-5 h-5 text-yellow-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">You have unsaved changes</span>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <button
          onClick={handleReset}
          disabled={saving}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${saving ? 'animate-spin' : ''}`} />
          Reset to Defaults
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </motion.div>
  );
};

export default AdminSettings;

class ApiConstants {
  static const String baseUrl = 'https://b70d-43-252-15-89.ngrok-free.app/api/';
  // For iOS simulator use: 'http://localhost:8000/api/'
  // For physical device use your machine's IP: 'http://192.168.x.x:8000/api/'

  // Auth
  static const String login = 'auth/login';
  static const String register = 'auth/register';
  static const String me = 'auth/me';

  // Expenses
  static const String expenses = 'expenses';
  static const String expenseStats = 'expenses/stats';

  // Categories
  static const String categories = 'categories';

  // Users
  static const String userProfile = 'users/me';
  static const String changePassword = 'users/me/change-password';

  // Parsers
  static const String parseSms = 'parse/sms';
  static const String parseReceipt = 'parse/receipt';
  static const String parseVoiceText = 'parse/voice-text';

  // Admin
  static const String adminDashboard = 'admin/dashboard';
  static const String adminUsers = 'admin/users';
  static const String adminSettings = 'admin/settings';
  static const String adminSettingsReset = 'admin/settings/reset';

  // Timeouts (default)
  static const int connectTimeout = 15000;
  static const int receiveTimeout = 15000;
  static const int sendTimeout = 15000;

  // Parser-specific timeouts (Gradio LLM calls can take up to 2 minutes)
  static const int parserReceiveTimeout = 120000; // 120 s
  static const int parserSendTimeout = 30000;     // 30 s
}

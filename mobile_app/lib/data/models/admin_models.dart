class AdminDashboardStats {
  final int totalUsers;
  final int activeUsers;
  final int totalExpenses;
  final double totalAmount;
  final double userGrowth;
  final double expenseGrowth;

  AdminDashboardStats({
    required this.totalUsers,
    required this.activeUsers,
    required this.totalExpenses,
    required this.totalAmount,
    required this.userGrowth,
    required this.expenseGrowth,
  });

  factory AdminDashboardStats.fromJson(Map<String, dynamic> json) {
    return AdminDashboardStats(
      totalUsers: json['totalUsers'] ?? 0,
      activeUsers: json['activeUsers'] ?? 0,
      totalExpenses: json['totalExpenses'] ?? 0,
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      userGrowth: (json['userGrowth'] ?? 0).toDouble(),
      expenseGrowth: (json['expenseGrowth'] ?? 0).toDouble(),
    );
  }
}

class AdminUserStats {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String status;
  final String role;
  final int expenses;
  final double totalAmount;
  final DateTime joinDate;
  final DateTime? lastActive;
  final String? avatar;

  AdminUserStats({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.status,
    required this.role,
    required this.expenses,
    required this.totalAmount,
    required this.joinDate,
    this.lastActive,
    this.avatar,
  });

  factory AdminUserStats.fromJson(Map<String, dynamic> json) {
    return AdminUserStats(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      status: json['status'] ?? 'active',
      role: json['role'] ?? 'user',
      expenses: json['expenses'] ?? 0,
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      joinDate: json['joinDate'] != null
          ? DateTime.parse(json['joinDate'])
          : DateTime.now(),
      lastActive: json['lastActive'] != null
          ? DateTime.parse(json['lastActive'])
          : null,
      avatar: json['avatar'],
    );
  }
}

class AdminSettings {
  final String siteName;
  final String supportEmail;
  final bool allowRegistration;
  final bool enableSMSParser;
  final bool enableReceiptOCR;
  final bool enableVoiceInput;

  AdminSettings({
    required this.siteName,
    required this.supportEmail,
    required this.allowRegistration,
    required this.enableSMSParser,
    required this.enableReceiptOCR,
    required this.enableVoiceInput,
  });

  factory AdminSettings.fromJson(Map<String, dynamic> json) {
    return AdminSettings(
      siteName: json['siteName'] ?? 'Smart Money Manager',
      supportEmail: json['supportEmail'] ?? 'support@moneymanager.com',
      allowRegistration: json['allowRegistration'] ?? true,
      enableSMSParser: json['enableSMSParser'] ?? true,
      enableReceiptOCR: json['enableReceiptOCR'] ?? true,
      enableVoiceInput: json['enableVoiceInput'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'siteName': siteName,
      'supportEmail': supportEmail,
      'allowRegistration': allowRegistration,
      'enableSMSParser': enableSMSParser,
      'enableReceiptOCR': enableReceiptOCR,
      'enableVoiceInput': enableVoiceInput,
    };
  }
}

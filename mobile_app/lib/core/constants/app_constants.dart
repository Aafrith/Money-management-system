class AppConstants {
  static const String appName = 'Smart Money Manager';
  static const String appVersion = '1.0.0';

  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String currencyKey = 'currency';

  // Default values
  static const String defaultCurrency = 'USD';

  // Currencies
  static const Map<String, CurrencyFormat> currencies = {
    'USD': CurrencyFormat(symbol: '\$', position: 'before', decimals: 2),
    'LKR': CurrencyFormat(symbol: 'Rs.', position: 'before', decimals: 2),
    'EUR': CurrencyFormat(symbol: '€', position: 'before', decimals: 2),
    'GBP': CurrencyFormat(symbol: '£', position: 'before', decimals: 2),
  };

  // Time ranges for stats
  static const List<String> timeRanges = ['7days', '30days', '90days', 'year'];
  static const Map<String, String> timeRangeLabels = {
    '7days': '7 Days',
    '30days': '30 Days',
    '90days': '90 Days',
    'year': '1 Year',
  };
}

class CurrencyFormat {
  final String symbol;
  final String position;
  final int decimals;

  const CurrencyFormat({
    required this.symbol,
    required this.position,
    required this.decimals,
  });

  String format(double amount) {
    final formatted = amount
        .toStringAsFixed(decimals)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (match) => '${match[1]},',
        );
    return position == 'before' ? '$symbol$formatted' : '$formatted$symbol';
  }
}

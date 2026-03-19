class DashboardStats {
  final double totalExpenses;
  final double monthlyChange;
  final int transactionCount;
  final List<CategoryStat> categoryBreakdown;
  final List<SourceStat> sourceBreakdown;
  final List<TrendData> trendData;
  final List<RecentTransaction> recentTransactions;

  DashboardStats({
    required this.totalExpenses,
    required this.monthlyChange,
    required this.transactionCount,
    required this.categoryBreakdown,
    required this.sourceBreakdown,
    required this.trendData,
    required this.recentTransactions,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalExpenses: (json['totalExpenses'] ?? 0).toDouble(),
      monthlyChange: (json['monthlyChange'] ?? 0).toDouble(),
      transactionCount: json['transactionCount'] ?? 0,
      categoryBreakdown:
          (json['categoryBreakdown'] as List?)
              ?.map((e) => CategoryStat.fromJson(e))
              .toList() ??
          [],
      sourceBreakdown:
          (json['sourceBreakdown'] as List?)
              ?.map((e) => SourceStat.fromJson(e))
              .toList() ??
          [],
      trendData:
          (json['trendData'] as List?)
              ?.map((e) => TrendData.fromJson(e))
              .toList() ??
          [],
      recentTransactions:
          (json['recentTransactions'] as List?)
              ?.map((e) => RecentTransaction.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class CategoryStat {
  final String name;
  final double value;
  final String color;
  final int count;

  CategoryStat({
    required this.name,
    required this.value,
    required this.color,
    required this.count,
  });

  factory CategoryStat.fromJson(Map<String, dynamic> json) {
    return CategoryStat(
      name: json['name'] ?? '',
      value: (json['value'] ?? 0).toDouble(),
      color: json['color'] ?? '#000000',
      count: json['count'] ?? 0,
    );
  }
}

class SourceStat {
  final String name;
  final int value;
  final String color;

  SourceStat({required this.name, required this.value, required this.color});

  factory SourceStat.fromJson(Map<String, dynamic> json) {
    return SourceStat(
      name: json['name'] ?? '',
      value: json['value'] ?? 0,
      color: json['color'] ?? '#000000',
    );
  }
}

class TrendData {
  final String date;
  final double amount;

  TrendData({required this.date, required this.amount});

  factory TrendData.fromJson(Map<String, dynamic> json) {
    return TrendData(
      date: json['date'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
    );
  }
}

class RecentTransaction {
  final String id;
  final String merchant;
  final double amount;
  final String category;
  final DateTime date;
  final String source;

  RecentTransaction({
    required this.id,
    required this.merchant,
    required this.amount,
    required this.category,
    required this.date,
    required this.source,
  });

  factory RecentTransaction.fromJson(Map<String, dynamic> json) {
    return RecentTransaction(
      id: json['id'] ?? '',
      merchant: json['merchant'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      category: json['category'] ?? '',
      date: json['date'] != null
          ? DateTime.parse(json['date'])
          : DateTime.now(),
      source: json['source'] ?? 'manual',
    );
  }
}

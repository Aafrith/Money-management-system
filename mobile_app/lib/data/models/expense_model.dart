class Expense {
  final String id;
  final String userId;
  final String merchant;
  final double amount;
  final String category;
  final DateTime date;
  final String? description;
  final String source;
  final DateTime createdAt;

  Expense({
    required this.id,
    required this.userId,
    required this.merchant,
    required this.amount,
    required this.category,
    required this.date,
    this.description,
    required this.source,
    required this.createdAt,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['user_id'] ?? '',
      merchant: json['merchant'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      category: json['category'] ?? 'Other',
      date: json['date'] != null
          ? DateTime.parse(json['date'])
          : DateTime.now(),
      description: json['description'],
      source: json['source'] ?? 'manual',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user_id': userId,
      'merchant': merchant,
      'amount': amount,
      'category': category,
      'date': date.toIso8601String(),
      'description': description,
      'source': source,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class ExpenseCreate {
  final String merchant;
  final double amount;
  final String category;
  final DateTime date;
  final String? description;
  final String source;

  ExpenseCreate({
    required this.merchant,
    required this.amount,
    required this.category,
    required this.date,
    this.description,
    this.source = 'manual',
  });

  Map<String, dynamic> toJson() {
    return {
      'merchant': merchant,
      'amount': amount,
      'category': category,
      'date': date.toIso8601String(),
      'description': description,
      'source': source,
    };
  }
}

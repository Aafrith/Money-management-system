class ParsedExpenseData {
  final String? merchant;
  final double? amount;
  final String? category;
  final DateTime? date;
  final String? description;
  final double confidence;
  final String source;
  final List<LineItem>? items;
  final double? tax;
  final double? discount;
  final String? time;

  ParsedExpenseData({
    this.merchant,
    this.amount,
    this.category,
    this.date,
    this.description,
    this.confidence = 0.0,
    required this.source,
    this.items,
    this.tax,
    this.discount,
    this.time,
  });

  factory ParsedExpenseData.fromJson(Map<String, dynamic> json) {
    return ParsedExpenseData(
      merchant: json['merchant'],
      amount: json['amount'] != null
          ? (json['amount'] as num).toDouble()
          : null,
      category: json['category'],
      date: json['date'] != null ? DateTime.parse(json['date']) : null,
      description: json['description'],
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      source: json['source'] ?? 'manual',
      items: (json['items'] as List?)
          ?.map((e) => LineItem.fromJson(e))
          .toList(),
      tax: json['tax'] != null ? (json['tax'] as num).toDouble() : null,
      discount: json['discount'] != null
          ? (json['discount'] as num).toDouble()
          : null,
      time: json['time'],
    );
  }
}

class LineItem {
  final String product;
  final double? price;

  LineItem({required this.product, this.price});

  factory LineItem.fromJson(Map<String, dynamic> json) {
    return LineItem(
      product: json['product'] ?? '',
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
    );
  }
}

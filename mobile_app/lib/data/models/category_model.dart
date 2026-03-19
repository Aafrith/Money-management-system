class Category {
  final String id;
  final String userId;
  final String name;
  final String color;
  final String icon;
  final DateTime createdAt;
  final int count;

  Category({
    required this.id,
    required this.userId,
    required this.name,
    required this.color,
    required this.icon,
    required this.createdAt,
    required this.count,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['user_id'] ?? '',
      name: json['name'] ?? '',
      color: json['color'] ?? '#000000',
      icon: json['icon'] ?? '📦',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      count: json['count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user_id': userId,
      'name': name,
      'color': color,
      'icon': icon,
      'created_at': createdAt.toIso8601String(),
      'count': count,
    };
  }
}

class CategoryCreate {
  final String name;
  final String color;
  final String icon;

  CategoryCreate({required this.name, required this.color, required this.icon});

  Map<String, dynamic> toJson() {
    return {'name': name, 'color': color, 'icon': icon};
  }
}

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String status;
  final String? phone;
  final String? avatar;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    this.phone,
    this.avatar,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      status: json['status'] ?? 'active',
      phone: json['phone'],
      avatar: json['avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role,
      'status': status,
      'phone': phone,
      'avatar': avatar,
    };
  }

  bool get isAdmin => role == 'admin';
}

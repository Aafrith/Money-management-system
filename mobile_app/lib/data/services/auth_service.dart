import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/secure_storage.dart';
import '../models/user_model.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(dioProvider), ref.read(secureStorageProvider));
});

class AuthService {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthService(this._dio, this._storage);

  Future<User> login(String email, String password) async {
    final response = await _dio.apiCall(
      () => _dio.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      ),
    );

    final token = response['access_token'] as String;
    final userData = response['user'] as Map<String, dynamic>;

    await _storage.saveToken(token);
    await _storage.saveUser(userData);

    return User.fromJson(userData);
  }

  Future<User> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _dio.apiCall(
      () => _dio.post(
        ApiConstants.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          'role': 'user',
        },
      ),
    );

    final token = response['access_token'] as String;
    final userData = response['user'] as Map<String, dynamic>;

    await _storage.saveToken(token);
    await _storage.saveUser(userData);

    return User.fromJson(userData);
  }

  Future<User> getCurrentUser() async {
    final response = await _dio.apiCall(() => _dio.get(ApiConstants.me));
    final user = User.fromJson(response);

    // Update local cache
    await _storage.saveUser(user.toJson());

    return user;
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }
}

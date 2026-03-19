import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/secure_storage.dart';
import '../models/user_model.dart';

final userServiceProvider = Provider<UserService>((ref) {
  return UserService(ref.read(dioProvider), ref.read(secureStorageProvider));
});

class UserService {
  final Dio _dio;
  final SecureStorageService _storage;

  UserService(this._dio, this._storage);

  Future<User> updateProfile({String? name, String? phone}) async {
    final data = <String, dynamic>{};
    if (name != null && name.isNotEmpty) data['name'] = name;
    if (phone != null && phone.isNotEmpty) data['phone'] = phone;

    final response = await _dio.apiCall(
      () => _dio.put(ApiConstants.userProfile, data: data),
    );

    final updatedUser = User.fromJson(response);
    await _storage.saveUser(updatedUser.toJson());

    return updatedUser;
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _dio.apiCall(
      () => _dio.post(
        ApiConstants.changePassword,
        data: {
          'current_password': currentPassword,
          'new_password': newPassword,
        },
      ),
    );
  }

  Future<void> deleteAccount() async {
    await _dio.apiCall(() => _dio.delete(ApiConstants.userProfile));
    await _storage.clearAll();
  }
}

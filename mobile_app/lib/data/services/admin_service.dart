import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/admin_models.dart';
import '../models/user_model.dart';

final adminServiceProvider = Provider<AdminService>((ref) {
  return AdminService(ref.read(dioProvider));
});

class AdminService {
  final Dio _dio;

  AdminService(this._dio);

  Future<AdminDashboardStats> getDashboardStats() async {
    final response = await _dio.apiCall(
      () => _dio.get(ApiConstants.adminDashboard),
    );
    return AdminDashboardStats.fromJson(response);
  }

  Future<List<AdminUserStats>> getUsers({
    int skip = 0,
    int limit = 100,
    String status = 'all',
    String? search,
  }) async {
    final queryParams = {
      'skip': skip,
      'limit': limit,
      'status_filter': status,
      if (search != null && search.isNotEmpty) 'search': search,
    };

    final response = await _dio.apiCall(
      () => _dio.get(ApiConstants.adminUsers, queryParameters: queryParams),
    );

    return (response as List).map((e) => AdminUserStats.fromJson(e)).toList();
  }

  Future<User> createUser(Map<String, dynamic> userData) async {
    final response = await _dio.apiCall(
      () => _dio.post(ApiConstants.adminUsers, data: userData),
    );
    return User.fromJson(response['user'] ?? response);
  }

  Future<User> updateUser(String id, Map<String, dynamic> data) async {
    final response = await _dio.apiCall(
      () => _dio.patch('${ApiConstants.adminUsers}/$id', data: data),
    );
    return User.fromJson(response);
  }

  Future<void> deleteUser(String id) async {
    await _dio.apiCall(() => _dio.delete('${ApiConstants.adminUsers}/$id'));
  }

  Future<AdminSettings> getSettings() async {
    final response = await _dio.apiCall(
      () => _dio.get(ApiConstants.adminSettings),
    );
    return AdminSettings.fromJson(response);
  }

  Future<AdminSettings> updateSettings(Map<String, dynamic> data) async {
    final response = await _dio.apiCall(
      () => _dio.patch(ApiConstants.adminSettings, data: data),
    );
    return AdminSettings.fromJson(response);
  }
}

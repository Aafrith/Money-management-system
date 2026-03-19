import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  // Token management
  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: AppConstants.tokenKey);
  }

  // User data
  Future<void> saveUser(Map<String, dynamic> user) async {
    await _storage.write(key: AppConstants.userKey, value: jsonEncode(user));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final data = await _storage.read(key: AppConstants.userKey);
    if (data != null) {
      return jsonDecode(data) as Map<String, dynamic>;
    }
    return null;
  }

  Future<void> deleteUser() async {
    await _storage.delete(key: AppConstants.userKey);
  }

  // Clear all
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // Theme
  Future<void> saveTheme(String theme) async {
    await _storage.write(key: AppConstants.themeKey, value: theme);
  }

  Future<String?> getTheme() async {
    return await _storage.read(key: AppConstants.themeKey);
  }

  // Currency
  Future<void> saveCurrency(String currency) async {
    await _storage.write(key: AppConstants.currencyKey, value: currency);
  }

  Future<String?> getCurrency() async {
    return await _storage.read(key: AppConstants.currencyKey);
  }
}

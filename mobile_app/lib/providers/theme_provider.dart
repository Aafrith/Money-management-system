import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/secure_storage.dart';

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  final storage = ref.read(secureStorageProvider);
  return ThemeNotifier(storage);
});

final currencyProvider = StateNotifierProvider<CurrencyNotifier, String>((ref) {
  final storage = ref.read(secureStorageProvider);
  return CurrencyNotifier(storage);
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  final SecureStorageService _storage;

  ThemeNotifier(this._storage) : super(ThemeMode.light) {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final savedTheme = await _storage.getTheme();
    if (savedTheme != null) {
      state = savedTheme == 'dark' ? ThemeMode.dark : ThemeMode.light;
    }
  }

  Future<void> toggleTheme() async {
    final newMode = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    state = newMode;
    await _storage.saveTheme(newMode.name);
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    await _storage.saveTheme(mode.name);
  }
}

class CurrencyNotifier extends StateNotifier<String> {
  final SecureStorageService _storage;

  CurrencyNotifier(this._storage) : super('USD') {
    _loadCurrency();
  }

  Future<void> _loadCurrency() async {
    final curr = await _storage.getCurrency();
    if (curr != null) {
      state = curr;
    }
  }

  Future<void> setCurrency(String currency) async {
    state = currency;
    await _storage.saveCurrency(currency);
  }
}

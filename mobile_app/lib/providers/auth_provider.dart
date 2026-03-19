import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/user_model.dart';
import '../data/services/auth_service.dart';
import '../data/services/user_service.dart';
import '../core/storage/secure_storage.dart';
import '../core/network/api_exceptions.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(authServiceProvider),
    ref.read(userServiceProvider),
    ref.read(secureStorageProvider),
  );
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final UserService _userService;
  final SecureStorageService _storage;

  AuthNotifier(this._authService, this._userService, this._storage)
    : super(AuthState()) {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final token = await _storage.getToken();
      if (token != null) {
        // First try loading from cache for fast UI
        final cachedData = await _storage.getUser();
        if (cachedData != null) {
          state = state.copyWith(
            user: User.fromJson(cachedData),
            isLoading: false,
          );
        }

        // Then refresh silently
        final user = await _authService.getCurrentUser();
        state = state.copyWith(user: user, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      if (e is UnauthorizedException) {
        await logout();
      } else {
        state = state.copyWith(isLoading: false);
      }
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authService.login(email, password);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authService.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updateProfile({String? name, String? phone}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _userService.updateProfile(name: name, phone: phone);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authService.logout();
    } finally {
      state = AuthState(); // Reset auth state entirely
    }
  }
}

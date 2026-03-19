import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../presentation/auth/login_screen.dart';
import '../presentation/auth/register_screen.dart';
import '../presentation/dashboard/dashboard_screen.dart';
import '../presentation/expenses/expenses_screen.dart';
import '../presentation/expenses/add_manual_screen.dart';
import '../presentation/expenses/add_receipt_screen.dart';
import '../presentation/expenses/add_sms_screen.dart';
import '../presentation/expenses/add_voice_screen.dart';
import '../presentation/categories/categories_screen.dart';
import '../presentation/profile/profile_screen.dart';
import '../presentation/settings/settings_screen.dart';
import '../presentation/navigation/main_shell.dart';
import '../providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isGoingToAuth =
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      // If not authenticated and not going to auth pages, redirect to login
      if (!isAuth && !isGoingToAuth) return '/login';

      // If authenticated and going to auth pages, redirect to dashboard
      if (isAuth && isGoingToAuth) return '/dashboard';

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) {
          return MainShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/expenses',
            builder: (context, state) => const ExpensesScreen(),
          ),
          GoRoute(
            path: '/categories',
            builder: (context, state) => const CategoriesScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/expenses/add/manual',
            builder: (context, state) => const AddManualScreen(),
          ),
          GoRoute(
            path: '/expenses/add/receipt',
            builder: (context, state) => const AddReceiptScreen(),
          ),
          GoRoute(
            path: '/expenses/add/sms',
            builder: (context, state) => const AddSMSScreen(),
          ),
          GoRoute(
            path: '/expenses/add/voice',
            builder: (context, state) => const AddVoiceScreen(),
          ),
          // TODO: Add Admin routes
        ],
      ),
    ],
  );
});

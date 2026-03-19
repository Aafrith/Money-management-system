import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class MainShell extends ConsumerWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Determine selected index based on current location
    final location = GoRouterState.of(context).matchedLocation;
    int currentIndex = _calculateSelectedIndex(location);

    final isAdmin = ref.watch(authProvider).user?.isAdmin ?? false;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.go('/expenses');
              break;
            case 2:
              context.go('/categories');
              break;
            case 3:
              context.go('/settings');
              break;
            case 4:
              if (isAdmin) {
                // context.go('/admin/dashboard');
              }
              break;
          }
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          const NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Expenses',
          ),
          const NavigationDestination(
            icon: Icon(Icons.category_outlined),
            selectedIcon: Icon(Icons.category),
            label: 'Categories',
          ),
          const NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
          if (isAdmin)
            const NavigationDestination(
              icon: Icon(Icons.admin_panel_settings_outlined),
              selectedIcon: Icon(Icons.admin_panel_settings),
              label: 'Admin',
            ),
        ],
      ),
    );
  }

  int _calculateSelectedIndex(String location) {
    if (location.startsWith('/dashboard')) {
      return 0;
    }
    if (location.startsWith('/expenses')) {
      return 1;
    }
    if (location.startsWith('/categories')) {
      return 2;
    }
    if (location.startsWith('/settings') || location.startsWith('/profile')) {
      return 3;
    }
    if (location.startsWith('/admin')) {
      return 4;
    }
    return 0;
  }
}

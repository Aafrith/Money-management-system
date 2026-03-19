import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    if (user == null) {
      return const Center(child: Text('Not logged in'));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: CircleAvatar(
              radius: 50,
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: Text(
                user.name.substring(0, 1).toUpperCase(),
                style: const TextStyle(fontSize: 40, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            user.name,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          Text(
            user.email,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 40),
          _buildProfileItem(
            context,
            icon: Icons.person_outline,
            title: 'Edit Profile',
            onTap: () {
              // TODO: Navigate to Edit Profile screen
            },
          ),
          _buildProfileItem(
            context,
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: () {
              // TODO: Navigate to Change Password screen
            },
          ),
          _buildProfileItem(
            context,
            icon: Icons.logout,
            title: 'Sign Out',
            color: Colors.red,
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildProfileItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? color,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: (color ?? Theme.of(context).colorScheme.primary).withValues(
            alpha: 0.1,
          ),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: color ?? Theme.of(context).colorScheme.primary,
        ),
      ),
      title: Text(
        title,
        style: TextStyle(color: color, fontWeight: FontWeight.w500),
      ),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}

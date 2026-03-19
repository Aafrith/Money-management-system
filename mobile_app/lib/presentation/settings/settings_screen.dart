import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/theme_provider.dart';
import '../../core/constants/app_constants.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final currency = ref.watch(currencyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Appearance',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ),
          SwitchListTile(
            title: const Text('Dark Mode'),
            subtitle: const Text('Toggle dark mode theme'),
            secondary: Icon(
              themeMode == ThemeMode.dark ? Icons.dark_mode : Icons.light_mode,
            ),
            value: themeMode == ThemeMode.dark,
            onChanged: (value) {
              ref
                  .read(themeProvider.notifier)
                  .setTheme(value ? ThemeMode.dark : ThemeMode.light);
            },
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Preferences',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ),
          ListTile(
            title: const Text('Currency'),
            subtitle: Text(AppConstants.currencies[currency]?.symbol ?? '\$'),
            leading: const Icon(Icons.payments_outlined),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              _showCurrencyDialog(context, ref, currency);
            },
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Account',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ),
          ListTile(
            title: const Text('Profile'),
            subtitle: const Text('Manage your account details'),
            leading: const Icon(Icons.person_outline),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile'),
          ),
        ],
      ),
    );
  }

  void _showCurrencyDialog(
    BuildContext context,
    WidgetRef ref,
    String current,
  ) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Select Currency'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: AppConstants.currencies.length,
              itemBuilder: (context, index) {
                final key = AppConstants.currencies.keys.elementAt(index);
                final format = AppConstants.currencies[key]!;
                return RadioListTile<String>(
                  title: Text('$key (${format.symbol})'),
                  value: key,
                  groupValue: current,
                  onChanged: (value) {
                    if (value != null) {
                      ref.read(currencyProvider.notifier).setCurrency(value);
                      Navigator.of(context).pop();
                    }
                  },
                );
              },
            ),
          ),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/loading_widget.dart';
import '../../core/widgets/error_widget.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/constants/app_constants.dart';
import '../../providers/expense_provider.dart';
import '../../providers/theme_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'all';
  String _selectedSource = 'all';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _refreshList() {
    ref
        .read(expensesProvider.notifier)
        .refresh(
          category: _selectedCategory == 'all' ? null : _selectedCategory,
          source: _selectedSource == 'all' ? null : _selectedSource,
          search: _searchQuery.isEmpty ? null : _searchQuery,
        );
  }

  @override
  Widget build(BuildContext context) {
    final expensesAsync = ref.watch(expensesProvider);
    final currency = ref.watch(currencyProvider);
    final format =
        AppConstants.currencies[currency] ?? AppConstants.currencies['USD']!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expenses'),
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(130),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search merchants or descriptions...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                              _refreshList();
                            },
                          )
                        : null,
                  ),
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                    // Debounce in a real app
                    Future.delayed(const Duration(milliseconds: 500), () {
                      if (_searchQuery == value && mounted) {
                        _refreshList();
                      }
                    });
                  },
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 12),
                        ),
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(
                            value: 'all',
                            child: Text('All Categories'),
                          ),
                          DropdownMenuItem(
                            value: 'Food & Dining',
                            child: Text('Food & Dining'),
                          ),
                          DropdownMenuItem(
                            value: 'Transportation',
                            child: Text('Transportation'),
                          ),
                          DropdownMenuItem(
                            value: 'Shopping',
                            child: Text('Shopping'),
                          ),
                          DropdownMenuItem(
                            value: 'Entertainment',
                            child: Text('Entertainment'),
                          ),
                          DropdownMenuItem(
                            value: 'Utilities',
                            child: Text('Utilities'),
                          ),
                          DropdownMenuItem(
                            value: 'Housing',
                            child: Text('Housing'),
                          ),
                          DropdownMenuItem(
                            value: 'Healthcare',
                            child: Text('Healthcare'),
                          ),
                          DropdownMenuItem(
                            value: 'Other',
                            child: Text('Other'),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedCategory = val);
                            _refreshList();
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedSource,
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 12),
                        ),
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(
                            value: 'all',
                            child: Text('All Sources'),
                          ),
                          DropdownMenuItem(
                            value: 'manual',
                            child: Text('Manual'),
                          ),
                          DropdownMenuItem(
                            value: 'receipt',
                            child: Text('Receipt'),
                          ),
                          DropdownMenuItem(value: 'sms', child: Text('SMS')),
                          DropdownMenuItem(
                            value: 'voice',
                            child: Text('Voice'),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedSource = val);
                            _refreshList();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: expensesAsync.when(
        data: (expenses) {
          if (expenses.isEmpty) {
            return EmptyStateWidget(
              icon: Icons.receipt_long_outlined,
              title: 'No expenses found',
              subtitle: 'Add a new expense to track your spending',
              action: ElevatedButton.icon(
                onPressed: () => context.go('/expenses/add-manual'),
                icon: const Icon(Icons.add),
                label: const Text('Add Expense'),
              ),
            );
          }

          // Group expenses by date (simple approach)
          // For real apps, you'd use a grouped list view

          return RefreshIndicator(
            onRefresh: () async => _refreshList(),
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 8, bottom: 80),
              itemCount: expenses.length,
              itemBuilder: (context, index) {
                final expense = expenses[index];

                IconData sourceIcon;
                switch (expense.source) {
                  case 'sms':
                    sourceIcon = Icons.textsms;
                    break;
                  case 'receipt':
                    sourceIcon = Icons.receipt;
                    break;
                  case 'voice':
                    sourceIcon = Icons.mic;
                    break;
                  default:
                    sourceIcon = Icons.edit_note;
                }

                return Dismissible(
                  key: Key(expense.id),
                  background: Container(
                    color: Colors.red,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  direction: DismissDirection.endToStart,
                  confirmDismiss: (direction) async {
                    return await showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return AlertDialog(
                          title: const Text("Confirm"),
                          content: const Text(
                            "Are you sure you wish to delete this expense?",
                          ),
                          actions: <Widget>[
                            TextButton(
                              onPressed: () => Navigator.of(context).pop(false),
                              child: const Text("CANCEL"),
                            ),
                            TextButton(
                              onPressed: () => Navigator.of(context).pop(true),
                              child: const Text(
                                "DELETE",
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ],
                        );
                      },
                    );
                  },
                  onDismissed: (direction) {
                    ref
                        .read(expensesProvider.notifier)
                        .deleteExpense(expense.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('${expense.merchant} deleted')),
                    );
                  },
                  child: Card(
                    margin: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(12),
                      leading: CircleAvatar(
                        radius: 24,
                        backgroundColor: Theme.of(
                          context,
                        ).colorScheme.primaryContainer,
                        child: Icon(
                          sourceIcon,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      title: Text(
                        expense.merchant,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${expense.category} • ${DateFormat('yyyy-MM-dd').format(expense.date)}',
                            ),
                            if (expense.description != null &&
                                expense.description!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2.0),
                                child: Text(
                                  expense.description!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                    color: Theme.of(
                                      context,
                                    ).textTheme.bodySmall?.color,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                          ],
                        ),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            format.format(expense.amount),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Theme.of(
                                context,
                              ).colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              expense.source.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      onTap: () {
                        // TODO: Navigate to detail/edit screen
                        context.go('/expenses/edit/${expense.id}');
                      },
                    ),
                  ).animate().fadeIn(duration: 300.ms).slideX(begin: 0.1, end: 0),
                );
              },
            ),
          );
        },
        loading: () => const AppLoadingWidget(),
        error: (error, _) => AppErrorWidget(
          message: 'Failed to load expenses',
          onRetry: () => _refreshList(),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/expenses/add-manual'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

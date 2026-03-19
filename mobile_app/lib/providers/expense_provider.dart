import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/expense_model.dart';
import '../data/models/dashboard_models.dart';
import '../data/services/expense_service.dart';

final timeRangeProvider = StateProvider<String>((ref) => '7days');

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final service = ref.watch(expenseServiceProvider);
  final range = ref.watch(timeRangeProvider);
  return await service.getStats(range: range);
});

class ExpenseListNotifier extends StateNotifier<AsyncValue<List<Expense>>> {
  final ExpenseService _service;
  final Ref _ref;

  ExpenseListNotifier(this._service, this._ref)
    : super(const AsyncValue.loading()) {
    refresh();
  }

  Future<void> refresh({
    String? category,
    String? source,
    String? search,
  }) async {
    try {
      state = const AsyncValue.loading();
      final expenses = await _service.getExpenses(
        category: category,
        source: source,
        search: search,
      );
      state = AsyncValue.data(expenses);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addExpense(ExpenseCreate expense) async {
    try {
      final newExpense = await _service.createExpense(expense);
      if (state.hasValue) {
        state = AsyncValue.data([newExpense, ...state.value!]);
      }
      _ref.invalidate(dashboardStatsProvider);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateExpense(String id, Map<String, dynamic> data) async {
    try {
      final updated = await _service.updateExpense(id, data);
      if (state.hasValue) {
        state = AsyncValue.data([
          for (final exp in state.value!)
            if (exp.id == id) updated else exp,
        ]);
      }
      _ref.invalidate(dashboardStatsProvider);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteExpense(String id) async {
    try {
      await _service.deleteExpense(id);
      if (state.hasValue) {
        state = AsyncValue.data(state.value!.where((e) => e.id != id).toList());
      }
      _ref.invalidate(dashboardStatsProvider);
    } catch (e) {
      rethrow;
    }
  }
}

final expensesProvider =
    StateNotifierProvider<ExpenseListNotifier, AsyncValue<List<Expense>>>((
      ref,
    ) {
      return ExpenseListNotifier(ref.watch(expenseServiceProvider), ref);
    });

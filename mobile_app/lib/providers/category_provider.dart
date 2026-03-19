import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/category_model.dart';
import '../data/services/category_service.dart';
import 'expense_provider.dart';

class CategoryListNotifier extends StateNotifier<AsyncValue<List<Category>>> {
  final CategoryService _service;
  final Ref _ref;

  CategoryListNotifier(this._service, this._ref)
    : super(const AsyncValue.loading()) {
    refresh();
  }

  Future<void> refresh() async {
    try {
      state = const AsyncValue.loading();
      final categories = await _service.getCategories();
      state = AsyncValue.data(categories);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addCategory(CategoryCreate category) async {
    try {
      final newCategory = await _service.createCategory(category);
      if (state.hasValue) {
        final current = state.value!;
        state = AsyncValue.data(
          [...current, newCategory]..sort((a, b) => a.name.compareTo(b.name)),
        );
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateCategory(String id, Map<String, dynamic> data) async {
    try {
      final updated = await _service.updateCategory(id, data);
      if (state.hasValue) {
        final current = state.value!;
        state = AsyncValue.data(
          [
            for (final cat in current)
              if (cat.id == id) updated else cat,
          ]..sort((a, b) => a.name.compareTo(b.name)),
        );
      }
      // If category name changed, we need to refresh expenses
      if (data.containsKey('name')) {
        _ref.invalidate(expensesProvider);
        _ref.invalidate(dashboardStatsProvider);
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteCategory(String id) async {
    try {
      await _service.deleteCategory(id);
      if (state.hasValue) {
        state = AsyncValue.data(state.value!.where((c) => c.id != id).toList());
      }
    } catch (e) {
      rethrow;
    }
  }
}

final categoriesProvider =
    StateNotifierProvider<CategoryListNotifier, AsyncValue<List<Category>>>((
      ref,
    ) {
      return CategoryListNotifier(ref.watch(categoryServiceProvider), ref);
    });

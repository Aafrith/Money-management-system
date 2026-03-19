import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/expense_model.dart';
import '../models/dashboard_models.dart';

final expenseServiceProvider = Provider<ExpenseService>((ref) {
  return ExpenseService(ref.read(dioProvider));
});

class ExpenseService {
  final Dio _dio;

  ExpenseService(this._dio);

  Future<List<Expense>> getExpenses({
    int skip = 0,
    int limit = 100,
    String? category,
    String? source,
    String? search,
    String? startDate,
    String? endDate,
  }) async {
    final queryParams = {
      'skip': skip,
      'limit': limit,
      if (category != null && category != 'all') 'category': category,
      if (source != null && source != 'all') 'source': source,
      if (search != null && search.isNotEmpty) 'search': search,
      if (startDate != null) 'start_date': startDate,
      if (endDate != null) 'end_date': endDate,
    };

    final response = await _dio.apiCall(
      () => _dio.get(ApiConstants.expenses, queryParameters: queryParams),
    );

    return (response as List).map((e) => Expense.fromJson(e)).toList();
  }

  Future<DashboardStats> getStats({String range = '7days'}) async {
    final response = await _dio.apiCall(
      () => _dio.get(
        ApiConstants.expenseStats,
        queryParameters: {'range': range},
      ),
    );
    return DashboardStats.fromJson(response);
  }

  Future<Expense> getExpenseById(String id) async {
    final response = await _dio.apiCall(
      () => _dio.get('${ApiConstants.expenses}/$id'),
    );
    return Expense.fromJson(response);
  }

  Future<Expense> createExpense(ExpenseCreate expense) async {
    final response = await _dio.apiCall(
      () => _dio.post(ApiConstants.expenses, data: expense.toJson()),
    );
    return Expense.fromJson(response);
  }

  Future<Expense> updateExpense(String id, Map<String, dynamic> data) async {
    final response = await _dio.apiCall(
      () => _dio.put('${ApiConstants.expenses}/$id', data: data),
    );
    return Expense.fromJson(response);
  }

  Future<void> deleteExpense(String id) async {
    await _dio.apiCall(() => _dio.delete('${ApiConstants.expenses}/$id'));
  }
}

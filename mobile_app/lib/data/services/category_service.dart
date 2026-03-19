import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/category_model.dart';

final categoryServiceProvider = Provider<CategoryService>((ref) {
  return CategoryService(ref.read(dioProvider));
});

class CategoryService {
  final Dio _dio;

  CategoryService(this._dio);

  Future<List<Category>> getCategories() async {
    final response = await _dio.apiCall(
      () => _dio.get(ApiConstants.categories),
    );
    return (response as List).map((e) => Category.fromJson(e)).toList();
  }

  Future<Category> createCategory(CategoryCreate category) async {
    final response = await _dio.apiCall(
      () => _dio.post(ApiConstants.categories, data: category.toJson()),
    );
    return Category.fromJson(response);
  }

  Future<Category> updateCategory(String id, Map<String, dynamic> data) async {
    final response = await _dio.apiCall(
      () => _dio.put('${ApiConstants.categories}/$id', data: data),
    );
    return Category.fromJson(response);
  }

  Future<void> deleteCategory(String id) async {
    await _dio.apiCall(() => _dio.delete('${ApiConstants.categories}/$id'));
  }
}

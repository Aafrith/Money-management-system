import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/parser_models.dart';

final parserServiceProvider = Provider<ParserService>((ref) {
  return ParserService(ref.read(dioProvider));
});

class ParserService {
  final Dio _dio;

  ParserService(this._dio);

  Future<ParsedExpenseData> parseSms(String text) async {
    final response = await _dio.apiCall(
      () => _dio.post(ApiConstants.parseSms, data: {'text': text}),
    );
    return ParsedExpenseData.fromJson(response);
  }

  Future<ParsedExpenseData> parseVoiceText(String text) async {
    final response = await _dio.apiCall(
      () => _dio.post(ApiConstants.parseVoiceText, data: {'text': text}),
    );
    return ParsedExpenseData.fromJson(response);
  }

  Future<ParsedExpenseData> parseReceipt(File imageFile) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        imageFile.path,
        filename: imageFile.path.split('/').last,
      ),
    });

    final response = await _dio.apiCall(
      () => _dio.post(
        ApiConstants.parseReceipt,
        data: formData,
        options: Options(
          sendTimeout: const Duration(minutes: 2), // Receipts take longer
          receiveTimeout: const Duration(minutes: 2),
        ),
      ),
    );

    return ParsedExpenseData.fromJson(response);
  }
}

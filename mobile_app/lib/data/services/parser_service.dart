import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/parser_models.dart';

final parserServiceProvider = Provider<ParserService>((ref) {
  return ParserService(ref.read(dioProvider));
});

/// Dio [Options] with extended timeouts for Gradio LLM-backed endpoints.
final _parserOptions = Options(
  receiveTimeout: const Duration(milliseconds: ApiConstants.parserReceiveTimeout),
  sendTimeout:    const Duration(milliseconds: ApiConstants.parserSendTimeout),
);

class ParserService {
  final Dio _dio;

  ParserService(this._dio);

  Future<ParsedExpenseData> parseSms(String text) async {
    final response = await _dio.apiCall(
      () => _dio.post(
        ApiConstants.parseSms,
        data: {'text': text},
        options: _parserOptions,
      ),
    );
    return ParsedExpenseData.fromJson(response as Map<String, dynamic>);
  }

  Future<ParsedExpenseData> parseVoiceText(String text) async {
    final response = await _dio.apiCall(
      () => _dio.post(
        ApiConstants.parseVoiceText,
        data: {'text': text},
        options: _parserOptions,
      ),
    );
    return ParsedExpenseData.fromJson(response as Map<String, dynamic>);
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
          // Receipts also need extended time for YOLO + upload
          sendTimeout:    const Duration(milliseconds: ApiConstants.parserSendTimeout),
          receiveTimeout: const Duration(milliseconds: ApiConstants.parserReceiveTimeout),
        ),
      ),
    );

    return ParsedExpenseData.fromJson(response as Map<String, dynamic>);
  }
}

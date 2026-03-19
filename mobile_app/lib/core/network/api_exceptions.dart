import 'package:dio/dio.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException({required this.message, this.statusCode, this.data});

  factory ApiException.fromDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message: 'Connection timed out. Please check your internet.',
          statusCode: null,
        );
      case DioExceptionType.connectionError:
        return ApiException(
          message: 'No internet connection. Please try again.',
          statusCode: null,
        );
      case DioExceptionType.badResponse:
        return _handleBadResponse(error.response);
      case DioExceptionType.cancel:
        return ApiException(message: 'Request was cancelled.');
      default:
        return ApiException(message: 'Something went wrong. Please try again.');
    }
  }

  static ApiException _handleBadResponse(Response? response) {
    final statusCode = response?.statusCode ?? 0;
    final data = response?.data;
    String message = 'Something went wrong';

    if (data is Map<String, dynamic>) {
      message = data['detail'] ?? data['message'] ?? message;
    }

    switch (statusCode) {
      case 400:
        return ApiException(message: message, statusCode: 400, data: data);
      case 401:
        return UnauthorizedException(message: message);
      case 403:
        return ForbiddenException(message: message);
      case 404:
        return ApiException(
          message: 'Resource not found',
          statusCode: 404,
          data: data,
        );
      case 422:
        return ValidationException(message: message, data: data);
      case 500:
        return ApiException(
          message: 'Server error. Please try again later.',
          statusCode: 500,
        );
      default:
        return ApiException(
          message: message,
          statusCode: statusCode,
          data: data,
        );
    }
  }

  @override
  String toString() => message;
}

class UnauthorizedException extends ApiException {
  UnauthorizedException({
    super.message = 'Session expired. Please login again.',
  }) : super(statusCode: 401);
}

class ForbiddenException extends ApiException {
  ForbiddenException({super.message = 'Access denied'})
    : super(statusCode: 403);
}

class ValidationException extends ApiException {
  ValidationException({super.message = 'Validation error', super.data})
    : super(statusCode: 422);
}

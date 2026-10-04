import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';

import '../constants/app_constants.dart';

/// The API's error body is `{ message, code?, fields?, details? }`: the app shows the French text
/// of `code` (assets/l10n, "errors.<code>"), never the English `message`.
extension ErrorHandler on DioException {
  Map<String, dynamic>? get body {
    final data = response?.data;
    return data is Map<String, dynamic> ? data : null;
  }

  String? get errorCode => body?['code'] as String?;

  Map<String, String>? get errorFields =>
      (body?['fields'] as Map?)?.map((key, value) => MapEntry(key.toString(), value.toString()));

  Map<String, dynamic>? get errorDetails => body?['details'] is Map<String, dynamic> ? body!['details'] as Map<String, dynamic> : null;

  String get errorMessage {
    if (type == DioExceptionType.connectionError || type == DioExceptionType.connectionTimeout || type == DioExceptionType.receiveTimeout) {
      return 'errors.network'.tr();
    }
    return translateErrorCode(errorFields?.values.firstOrNull ?? errorCode);
  }
}

/// French text of an API code ("errors.<code>"), or the generic message.
String translateErrorCode(String? code) {
  if (code == null) return 'errors.generic'.tr();
  // The API says `not_found` for anything; for a traveller it is always their booking.
  final key = code == 'not_found' && !AppConstants.isPro ? 'errors.booking_not_found' : 'errors.$code';
  final text = key.tr();
  return text == key ? 'errors.generic'.tr() : text;
}

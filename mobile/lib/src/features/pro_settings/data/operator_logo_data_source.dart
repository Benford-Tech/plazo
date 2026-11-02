import 'dart:typed_data';

import 'package:dio/dio.dart';

/// The parking's logo (02/11/2026, « pouvoir personnaliser Plazo avec l'icône du parking », direction B): the same routes
/// as the web's « Logo du parking ». Shown to the team next to the Plazo Pro sign; served with the session, never by a
/// public link.
abstract class OperatorLogoDataSource {
  /// POST /internal/operator/logo: the image's bytes (PNG or JPEG), replacing the previous logo; its new date.
  Future<DateTime?> upload(Uint8List bytes, {required String contentType});

  /// DELETE /internal/operator/logo.
  Future<void> remove();

  /// GET /internal/operator/logo, kept in memory by its date (a changed logo is fetched again).
  Future<Uint8List?> load(DateTime updatedAt);
}

class OperatorLogoDataSourceImpl implements OperatorLogoDataSource {
  OperatorLogoDataSourceImpl(this._dio);
  final Dio _dio;
  final Map<String, Uint8List> _cache = {};

  @override
  Future<DateTime?> upload(Uint8List bytes, {required String contentType}) async {
    final res = await _dio.post<Map<String, dynamic>>(
      'internal/operator/logo',
      data: Stream.fromIterable([bytes]),
      options: Options(contentType: contentType, headers: {Headers.contentLengthHeader: bytes.length}, sendTimeout: const Duration(seconds: 60)),
    );
    final at = res.data?['logoUpdatedAt'] as String?;
    return at == null ? null : DateTime.tryParse(at);
  }

  @override
  Future<void> remove() async {
    await _dio.delete<Map<String, dynamic>>('internal/operator/logo');
  }

  @override
  Future<Uint8List?> load(DateTime updatedAt) async {
    final key = updatedAt.toIso8601String();
    final cached = _cache[key];
    if (cached != null) return cached;
    try {
      final res = await _dio.get<List<int>>(
        'internal/operator/logo',
        queryParameters: {'v': key},
        options: Options(responseType: ResponseType.bytes),
      );
      final bytes = Uint8List.fromList(res.data ?? const []);
      if (bytes.isEmpty) return null;
      _cache
        ..clear()
        ..[key] = bytes;
      return bytes;
    } on DioException {
      return null;
    }
  }
}

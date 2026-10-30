import 'dart:typed_data';

import 'package:dio/dio.dart';

/// The member's own photo (30/10/2026, « ajoute la photo dans Plazo Pro »): the same routes as the web's « Ma photo ».
/// Only seen by the team; the photo is served by the API with the session, never by a public link.
abstract class StaffPhotoDataSource {
  /// The date of the member's photo (from GET /internal/staff/me), or null without one; and whether the session is the
  /// prospects' demo, where the photo does not change.
  Future<({DateTime? photoUpdatedAt, bool demo})> mine();

  /// POST /internal/staff/me/photo: the JPEG's bytes, replacing the previous photo.
  Future<void> upload(Uint8List bytes);

  /// DELETE /internal/staff/me/photo.
  Future<void> remove();

  /// GET /internal/staff/:id/photo, kept in memory by its date (a changed photo is fetched again).
  Future<Uint8List?> load(String staffId, DateTime updatedAt);
}

class StaffPhotoDataSourceImpl implements StaffPhotoDataSource {
  StaffPhotoDataSourceImpl(this._dio);
  final Dio _dio;
  final Map<String, Uint8List> _cache = {};

  @override
  Future<({DateTime? photoUpdatedAt, bool demo})> mine() async {
    final res = await _dio.get<Map<String, dynamic>>('internal/staff/me');
    final data = res.data ?? const {};
    final at = data['photoUpdatedAt'] as String?;
    return (photoUpdatedAt: at == null ? null : DateTime.tryParse(at), demo: data['demo'] != null);
  }

  @override
  Future<void> upload(Uint8List bytes) async {
    await _dio.post<Map<String, dynamic>>(
      'internal/staff/me/photo',
      data: Stream.fromIterable([bytes]),
      options: Options(contentType: 'image/jpeg', headers: {Headers.contentLengthHeader: bytes.length}, sendTimeout: const Duration(seconds: 60)),
    );
  }

  @override
  Future<void> remove() async {
    await _dio.delete<Map<String, dynamic>>('internal/staff/me/photo');
  }

  @override
  Future<Uint8List?> load(String staffId, DateTime updatedAt) async {
    final key = '$staffId@${updatedAt.toIso8601String()}';
    final cached = _cache[key];
    if (cached != null) return cached;
    try {
      final res = await _dio.get<List<int>>('internal/staff/$staffId/photo', options: Options(responseType: ResponseType.bytes));
      final bytes = Uint8List.fromList(res.data ?? const []);
      if (bytes.isEmpty) return null;
      _cache.removeWhere((k, _) => k.startsWith('$staffId@'));
      return _cache[key] = bytes;
    } on DioException {
      return null;
    }
  }
}

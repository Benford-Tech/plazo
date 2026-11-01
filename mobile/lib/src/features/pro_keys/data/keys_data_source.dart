import 'package:dio/dio.dart';

/// The keys of a car on the parking, as the server keeps them: when they were left, and the hook they hang on.
class KeysState {
  const KeysState({this.keysLeftAt, this.keyHook});

  final DateTime? keysLeftAt;
  final String? keyHook;

  bool get left => keysLeftAt != null || keyHook != null;
}

abstract class KeysDataSource {
  /// `left: false` with no hook: « Clés ? »; `left: true` with no hook: « Laissées »; a hook: on that hook (keys left).
  Future<KeysState> setKeys(String reservationId, {required bool left, String? keyHook});
}

/// PUT /internal/reservations/:id/keys (26/10/2026, `reservations:status`): `{ left, keyHook }`, a null hook removes it.
class KeysDataSourceImpl implements KeysDataSource {
  KeysDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<KeysState> setKeys(String reservationId, {required bool left, String? keyHook}) async {
    final res = await _dio.put<Map<String, dynamic>>('internal/reservations/$reservationId/keys', data: {'left': left, 'keyHook': keyHook});
    final body = res.data ?? const <String, dynamic>{};
    final data = body['data'] is Map<String, dynamic> ? body['data'] as Map<String, dynamic> : body;
    final at = data['keysLeftAt'] as String?;
    return KeysState(keysLeftAt: at == null ? null : DateTime.tryParse(at), keyHook: data['keyHook'] as String?);
  }
}

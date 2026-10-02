import 'dart:async';

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../services/secure_storage_service.dart';

/// Logs the method, path and status only: bodies and headers may hold a manage token, a staff
/// token, a traveller's personal data or position (RGPD: never logged).
class LoggingInterceptor extends Interceptor {
  LoggingInterceptor({this.logger});

  final Logger? logger;

  @override
  void onResponse(Response<dynamic> response, ResponseInterceptorHandler handler) {
    logger?.i('[${response.requestOptions.method}] ${response.requestOptions.path} → ${response.statusCode}');
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final body = err.response?.data;
    final code = body is Map ? body['code'] : null;
    logger?.w('[${err.requestOptions.method}] ${err.requestOptions.path} → ${err.response?.statusCode ?? err.type.name} ${code ?? ''}');
    super.onError(err, handler);
  }
}

/// Tells the app the staff session is over (refresh refused): back to the login screen.
class SessionEvents {
  final _expired = StreamController<void>.broadcast();
  Stream<void> get expired => _expired.stream;
  void notifyExpired() => _expired.add(null);
}

/// Staff routes (/internal/...): adds the access token, and on a 401 rotates the pair once with the
/// refresh token (as the pro space does), then replays the request. Parallel 401s wait for the same
/// rotation (QueuedInterceptor).
class StaffTokenInterceptor extends QueuedInterceptor {
  StaffTokenInterceptor({required this.storage, required this.refreshDio, required this.session});

  final SecureStorageService storage;

  /// A bare client (no interceptor) for the refresh call itself.
  final Dio refreshDio;
  final SessionEvents session;

  static bool _isStaffRoute(RequestOptions o) => o.path.startsWith('internal/') && !o.path.startsWith('internal/auth/');

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (_isStaffRoute(options) || options.path == 'internal/auth/logout') {
      final tokens = await storage.staffTokens();
      if (tokens != null) options.headers['Authorization'] = 'Bearer ${tokens.access}';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final options = err.requestOptions;
    if (err.response?.statusCode != 401 || !_isStaffRoute(options) || options.extra['retried'] == true) {
      return handler.next(err);
    }
    final tokens = await storage.staffTokens();
    final sent = (options.headers['Authorization'] as String?)?.replaceFirst('Bearer ', '');
    try {
      String? access = tokens?.access;
      // Another request already rotated the pair while this one waited: just replay it.
      if (tokens != null && sent == tokens.access) access = await _refresh(tokens.refresh);
      if (access == null) {
        await storage.clearStaffTokens();
        session.notifyExpired();
        return handler.next(err);
      }
      options.headers['Authorization'] = 'Bearer $access';
      options.extra['retried'] = true;
      final response = await refreshDio.fetch<dynamic>(options);
      return handler.resolve(response);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }

  Future<String?> _refresh(String refreshToken) async {
    try {
      final res = await refreshDio.post<Map<String, dynamic>>('internal/auth/refresh', data: {'refreshToken': refreshToken});
      final data = res.data?['tokenData'] as Map<String, dynamic>?;
      final access = (data?['access'] as Map?)?['token'] as String?;
      final refresh = (data?['refresh'] as Map?)?['token'] as String?;
      if (access == null || refresh == null) return null;
      await storage.saveStaffTokens(StaffTokens(access: access, refresh: refresh));
      return access;
    } on DioException {
      return null;
    }
  }
}

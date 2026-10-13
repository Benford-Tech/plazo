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

/// Tells the app the staff session is over (refresh refused): back to the login screen. Also tells it the onboarding
/// session (« Rejoindre un parking », 13/10/2026) was refused.
class SessionEvents {
  final _expired = StreamController<void>.broadcast();
  Stream<void> get expired => _expired.stream;
  void notifyExpired() => _expired.add(null);

  final _onboardingExpired = StreamController<void>.broadcast();
  Stream<void> get onboardingExpired => _onboardingExpired.stream;
  void notifyOnboardingExpired() => _onboardingExpired.add(null);
}

/// A 401 that refuses what the person just confirmed (a wrong password, an Apple confirmation for another Apple ID,
/// a Google token that does not verify), not the session's token: the session stays, the screen shows the error.
const credentialRefusalCodes = {'reauth_failed', 'identity_invalid', 'invalid_credentials'};

/// The token itself was refused: a 401 whose code is not one of [credentialRefusalCodes] (an API without a body
/// counts as a refused token, as before).
bool isRefusedToken(DioException err) {
  if (err.response?.statusCode != 401) return false;
  final body = err.response?.data;
  final code = body is Map ? body['code'] : null;
  return !credentialRefusalCodes.contains(code);
}

/// The onboarding routes (/internal/auth/onboarding*, 13/10/2026) carry the onboarding token of a person signed in
/// with Apple or Google who has not joined a parking yet. They sit under internal/auth/, which StaffTokenInterceptor
/// leaves alone: a 401 there clears the onboarding token only, never the staff's session.
class OnboardingTokenInterceptor extends Interceptor {
  OnboardingTokenInterceptor({required this.storage, required this.session});

  final SecureStorageService storage;
  final SessionEvents session;

  static bool isOnboardingRoute(RequestOptions o) => o.path.startsWith('internal/auth/onboarding');

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (isOnboardingRoute(options) && options.headers['Authorization'] == null) {
      final token = await storage.onboardingToken();
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (isRefusedToken(err) && isOnboardingRoute(err.requestOptions)) {
      await storage.clearOnboardingToken();
      session.notifyOnboardingExpired();
    }
    handler.next(err);
  }
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
    // A refused confirmation (« Supprimer mon compte » with a wrong password…) is no reason to rotate the pair, nor
    // to send the password or a single-use Apple code again.
    if (!isRefusedToken(err) || !_isStaffRoute(options) || options.extra['retried'] == true) {
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

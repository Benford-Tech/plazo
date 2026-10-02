part of 'locator.dart';

BaseOptions _options() => BaseOptions(
  baseUrl: AppConstants.baseUrl.endsWith('/') ? AppConstants.baseUrl : '${AppConstants.baseUrl}/',
  connectTimeout: const Duration(seconds: 20),
  receiveTimeout: const Duration(seconds: 20),
  sendTimeout: const Duration(seconds: 20),
  contentType: 'application/json',
);

void _initExternal() {
  locator
    ..registerLazySingleton<Logger>(Logger.new)
    ..registerLazySingleton<Dio>(() {
      // A bare client for the token refresh (and the replay of the refused request).
      final refreshDio = Dio(_options())..interceptors.add(LoggingInterceptor(logger: locator()));
      return Dio(_options())
        ..interceptors.addAll([
          StaffTokenInterceptor(storage: locator(), refreshDio: refreshDio, session: locator()),
          LoggingInterceptor(logger: locator()),
        ]);
    });
}

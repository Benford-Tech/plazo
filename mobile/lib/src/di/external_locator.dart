part of 'locator.dart';

BaseOptions _options() => BaseOptions(
  baseUrl: AppConstants.baseUrl.endsWith('/') ? AppConstants.baseUrl : '${AppConstants.baseUrl}/',
  connectTimeout: const Duration(seconds: 20),
  receiveTimeout: const Duration(seconds: 20),
  sendTimeout: const Duration(seconds: 20),
  contentType: 'application/json',
  // 15/11/2026 (Plateforme › Invitations): Plazo Pro says which phone it runs on, so that a sign-in after an invitation
  // counts as « has the app ». Not on the web build (a custom header there would need the API's CORS).
  headers: _clientHeader(),
);

Map<String, String>? _clientHeader() {
  if (kIsWeb || !AppConstants.isPro) return null;
  return switch (defaultTargetPlatform) {
    TargetPlatform.iOS => {'X-Plazo-Client': 'pro-ios'},
    TargetPlatform.android => {'X-Plazo-Client': 'pro-android'},
    _ => {'X-Plazo-Client': 'pro-other'},
  };
}

void _initExternal() {
  locator
    ..registerLazySingleton<Logger>(Logger.new)
    ..registerLazySingleton<Dio>(() {
      // A bare client for the token refresh (and the replay of the refused request).
      final refreshDio = Dio(_options())..interceptors.add(LoggingInterceptor(logger: locator()));
      return Dio(_options())
        ..interceptors.addAll([
          StaffTokenInterceptor(storage: locator(), refreshDio: refreshDio, session: locator()),
          OnboardingTokenInterceptor(storage: locator(), session: locator()),
          LoggingInterceptor(logger: locator()),
        ]);
    });
}

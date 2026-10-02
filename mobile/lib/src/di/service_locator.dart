part of 'locator.dart';

void _initServices() {
  locator
    ..registerLazySingleton<SecureStorageService>(SecureStorageServiceImpl.new)
    ..registerLazySingleton<LocationService>(GeolocatorLocationService.new)
    ..registerLazySingleton<PushService>(OneSignalPushService.new)
    ..registerLazySingleton<SessionEvents>(SessionEvents.new)
    ..registerLazySingleton<LinkService>(UrlLauncherLinkService.new)
    // Stripe's native sheet; a stand-in only for browser trials given PAYMENT_SHEET_DEMO (README).
    ..registerLazySingleton<PaymentSheetService>(
      () => DemoPaymentSheetService.configuredMode.isEmpty
          ? StripePaymentSheetService()
          : DemoPaymentSheetService(() => locator<AppRouter>().navigatorKey.currentContext, mode: DemoPaymentSheetService.configuredMode),
    )
    ..registerLazySingleton<BookingDraftStore>(BookingDraftStore.new);
}

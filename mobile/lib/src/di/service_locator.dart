part of 'locator.dart';

void _initServices() {
  locator
    ..registerLazySingleton<SecureStorageService>(SecureStorageServiceImpl.new)
    ..registerLazySingleton<LocationService>(GeolocatorLocationService.new)
    ..registerLazySingleton<PushService>(OneSignalPushService.new)
    ..registerLazySingleton<SessionEvents>(SessionEvents.new);
}

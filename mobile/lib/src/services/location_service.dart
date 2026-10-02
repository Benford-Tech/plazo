import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

/// A position of the phone. Kept in memory only (never stored on the phone).
class GeoPosition extends Equatable {
  const GeoPosition({required this.lat, required this.lng, this.accuracy, required this.recordedAt});

  final double lat;
  final double lng;
  final double? accuracy;
  final DateTime recordedAt;

  @override
  List<Object?> get props => [lat, lng, accuracy, recordedAt];
}

enum LocationAccess { granted, denied, deniedForever, serviceDisabled }

/// The phone's location. Permission is only asked when the traveller taps "Je suis en route".
abstract class LocationService {
  Future<LocationAccess> requestAccess();

  /// Live positions. [background]: keep going when the app is in the background (Android foreground
  /// service with its notification, iOS background location), until the subscription is cancelled.
  Stream<GeoPosition> positions({bool background = true});

  Future<GeoPosition?> current();
}

class GeolocatorLocationService implements LocationService {
  @override
  Future<LocationAccess> requestAccess() async {
    if (!await Geolocator.isLocationServiceEnabled()) return LocationAccess.serviceDisabled;
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
    return switch (permission) {
      LocationPermission.always || LocationPermission.whileInUse => LocationAccess.granted,
      LocationPermission.deniedForever => LocationAccess.deniedForever,
      _ => LocationAccess.denied,
    };
  }

  @override
  Stream<GeoPosition> positions({bool background = true}) {
    return Geolocator.getPositionStream(locationSettings: _settings(background)).map(_toGeo);
  }

  @override
  Future<GeoPosition?> current() async {
    try {
      return _toGeo(await Geolocator.getCurrentPosition(locationSettings: _settings(false)));
    } catch (_) {
      return null;
    }
  }

  static GeoPosition _toGeo(Position p) =>
      GeoPosition(lat: p.latitude, lng: p.longitude, accuracy: p.accuracy, recordedAt: p.timestamp.toUtc());

  LocationSettings _settings(bool background) {
    if (kIsWeb) return WebSettings(accuracy: LocationAccuracy.high, maximumAge: const Duration(seconds: 5));
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return AndroidSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 20,
          intervalDuration: const Duration(seconds: 10),
          // Android: a foreground service, with its notification, keeps the sharing alive in the background.
          foregroundNotificationConfig: background
              ? const ForegroundNotificationConfig(
                  notificationTitle: 'Partage de position avec le parking en cours',
                  notificationText: "S'arrête à votre arrivée, ou au bout de 2 h au plus.",
                  notificationChannelName: 'Partage de position',
                  enableWakeLock: true,
                  setOngoing: true,
                )
              : null,
        );
      case TargetPlatform.iOS:
        return AppleSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 20,
          activityType: ActivityType.automotiveNavigation,
          pauseLocationUpdatesAutomatically: false,
          allowBackgroundLocationUpdates: background,
          showBackgroundLocationIndicator: background,
        );
      default:
        return const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 20);
    }
  }
}

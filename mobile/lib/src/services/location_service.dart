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

/// What the Android foreground service's notification says while positions are shared.
class LocationNotice {
  const LocationNotice({required this.title, required this.text, required this.channel});
  final String title;
  final String text;
  final String channel;

  /// The traveller sharing with the parking (the default).
  static const traveller = LocationNotice(
    title: 'Partage de position avec le parking en cours',
    text: "S'arrête à votre arrivée, ou au bout de 2 h au plus.",
    channel: 'Partage de position',
  );

  /// The driver sharing with the travellers they pick up.
  static const driver = LocationNotice(
    title: 'Trajet navette en cours — position partagée avec vos clients',
    text: "S'arrête quand vous terminez le trajet, ou au bout de 90 min.",
    channel: 'Trajet navette',
  );
}

/// The phone's location. Permission is only asked when the traveller taps "Je suis en route".
abstract class LocationService {
  Future<LocationAccess> requestAccess();

  /// Live positions. [background]: keep going when the app is in the background (Android foreground
  /// service with its notification, iOS background location), until the subscription is cancelled.
  Stream<GeoPosition> positions({bool background = true, LocationNotice notice = LocationNotice.traveller});

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
  Stream<GeoPosition> positions({bool background = true, LocationNotice notice = LocationNotice.traveller}) {
    return Geolocator.getPositionStream(locationSettings: _settings(background, notice)).map(_toGeo);
  }

  @override
  Future<GeoPosition?> current() async {
    try {
      return _toGeo(await Geolocator.getCurrentPosition(locationSettings: _settings(false, LocationNotice.traveller)));
    } catch (_) {
      return null;
    }
  }

  static GeoPosition _toGeo(Position p) =>
      GeoPosition(lat: p.latitude, lng: p.longitude, accuracy: p.accuracy, recordedAt: p.timestamp.toUtc());

  LocationSettings _settings(bool background, LocationNotice notice) {
    if (kIsWeb) return WebSettings(accuracy: LocationAccuracy.high, maximumAge: const Duration(seconds: 5));
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return AndroidSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 20,
          intervalDuration: const Duration(seconds: 10),
          // Android: a foreground service, with its notification, keeps the sharing alive in the background.
          foregroundNotificationConfig: background
              ? ForegroundNotificationConfig(
                  notificationTitle: notice.title,
                  notificationText: notice.text,
                  notificationChannelName: notice.channel,
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

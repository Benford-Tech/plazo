import 'dart:math' as math;

import 'package:latlong2/latlong.dart';

import '../../../../shared/widgets/shuttle_icon.dart';
import '../../data/models/public_models.dart';

/// L3 « Le trajet en direct » (14/10/2026): a parking's running shuttles on a small rail from the parking (P) to the
/// terminal, each placed at its real progress. Same rules as the site (site/src/lib/shuttle-rail.ts); the rail itself
/// is presentation/widgets/shuttle_box.dart.

/// At most this many minibuses on one rail.
const maxRailShuttles = 3;

/// A minibus never sits on the P nor on the plane: its progress is kept within 5–95 %.
const railMin = 0.05;
const railMax = 0.95;

/// Great-circle distance in metres (haversine).
double metresBetween(LatLngModel a, LatLngModel b) {
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(b.lat - a.lat);
  final dLng = rad(b.lng - a.lng);
  final h = math.pow(math.sin(dLat / 2), 2) + math.cos(rad(a.lat)) * math.cos(rad(b.lat)) * math.pow(math.sin(dLng / 2), 2);
  return 2 * 6371000 * math.asin(math.min(1, math.sqrt(h)));
}

/// distance(parking → shuttle) ÷ distance(parking → airport), clamped to 5–95 %; null when it cannot be measured.
double? railProgress(LatLngModel parking, LatLngModel airport, LatLngModel shuttle) {
  final route = metresBetween(parking, airport);
  if (!(route > 0)) return null;
  return (metresBetween(parking, shuttle) / route).clamp(railMin, railMax).toDouble();
}

class RailMarker {
  const RailMarker({required this.id, required this.progress, this.towardsParking = false});

  final String id;

  /// 0.05–0.95 from the parking (left) to the terminal (right).
  final double progress;

  /// The minibus faces the terminal unless its last move went back towards the parking.
  final bool towardsParking;

  @override
  bool operator ==(Object other) => other is RailMarker && other.id == id && other.progress == progress && other.towardsParking == towardsParking;

  @override
  int get hashCode => Object.hash(id, progress, towardsParking);

  @override
  String toString() => 'RailMarker($id, ${progress.toStringAsFixed(2)}${towardsParking ? ', back' : ''})';
}

class RailState {
  const RailState({this.running = 0, this.markers = const [], this.ageSeconds});

  /// Running shuttles of the parking right now (with or without a position).
  final int running;
  final List<RailMarker> markers;

  /// Age of the freshest position among the parking's running shuttles, in seconds when the answer was served; null
  /// without one.
  final int? ageSeconds;
}

LatLng _point(LatLngModel p) => LatLng(p.lat, p.lng);

/// The angle between two compass bearings, 0–180°.
double _angleBetween(double a, double b) {
  final d = (a - b).abs() % 360;
  return d > 180 ? 360 - d : d;
}

/// The rail of one parking from the airport's live answer: its running shuttles, the freshest first, at most three
/// markers, none for a shuttle without a position (nor when the parking or the airport has no known position).
/// [headings]: each shuttle's heading from its previous position (trip id → degrees), to turn its minibus.
RailState railState(AirportLiveModel? live, String slug, {LatLngModel? fallbackParking, Map<String, double> headings = const {}}) {
  final shuttles = (live?.shuttles ?? const <LiveShuttleModel>[]).where((s) => s.parking == slug).toList();
  final located = shuttles.where((s) => s.position != null).toList()
    ..sort((a, b) => (a.positionAgeSeconds ?? 1 << 30).compareTo(b.positionAgeSeconds ?? 1 << 30));
  final ages = located.map((s) => s.positionAgeSeconds).whereType<int>();
  final parking = live?.parkings.where((p) => p.slug == slug).firstOrNull?.location ?? fallbackParking;
  final airport = live?.airport.location;
  final markers = <RailMarker>[];
  if (parking != null && airport != null) {
    final route = shuttleBearing(_point(parking), _point(airport));
    for (final s in located) {
      if (markers.length >= maxRailShuttles) break;
      final progress = railProgress(parking, airport, s.position!);
      if (progress == null) continue;
      final heading = headings[s.id];
      markers.add(RailMarker(id: s.id, progress: progress, towardsParking: heading != null && route != null && _angleBetween(heading, route) > 90));
    }
  }
  return RailState(running: shuttles.length, markers: markers, ageSeconds: ages.isEmpty ? null : ages.reduce(math.min));
}

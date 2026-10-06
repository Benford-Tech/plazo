import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../theme/theme.dart';

/// I-C (06/10/2026): the shuttle pictogram — a minibus seen from the side, in a white pill bordered
/// with the colour of its direction, turned the way it drives. To the terminal: the accent; to the
/// airport to fetch travellers: peach; no position: grey.
enum ShuttleTone { terminal, airport, unknown }

ShuttleTone shuttleToneOf(String direction, {required bool hasPosition}) {
  if (!hasPosition) return ShuttleTone.unknown;
  return direction == 'dropoff' ? ShuttleTone.terminal : ShuttleTone.airport;
}

Color shuttleColour(ShuttleTone tone) => switch (tone) {
  ShuttleTone.terminal => AppColors.accent,
  ShuttleTone.airport => AppColors.peach,
  ShuttleTone.unknown => AppColors.muted,
};

/// Compass bearing from one position to the next (0 = north, 90 = east); null under ~8 m (GPS jitter).
double? shuttleBearing(LatLng from, LatLng to) {
  final dLat = (to.latitude - from.latitude) * 111000;
  final dLng = (to.longitude - from.longitude) * 111000 * math.cos(from.latitudeInRad);
  if (math.sqrt(dLat * dLat + dLng * dLng) < 8) return null;
  final dLon = (to.longitude - from.longitude) * math.pi / 180;
  final y = math.sin(dLon) * math.cos(to.latitudeInRad);
  final x = math.cos(from.latitudeInRad) * math.sin(to.latitudeInRad) - math.sin(from.latitudeInRad) * math.cos(to.latitudeInRad) * math.cos(dLon);
  return (math.atan2(y, x) * 180 / math.pi + 360) % 360;
}

/// The headings of the shuttles after a poll: from the previous positions, kept when the bus barely moved.
Map<String, double> shuttleHeadings(Map<String, LatLng> before, Map<String, double> beforeHeadings, Map<String, LatLng> now) {
  final out = <String, double>{};
  for (final e in now.entries) {
    final prev = before[e.key];
    final heading = prev == null ? null : shuttleBearing(prev, e.value) ?? beforeHeadings[e.key];
    if (heading != null) out[e.key] = heading;
  }
  return out;
}

/// The minibus, facing east at rest and turned by [heading]; a heading west mirrors it.
class ShuttleIcon extends StatelessWidget {
  const ShuttleIcon({super.key, this.tone = ShuttleTone.terminal, this.heading, this.size = 20, this.color});
  final ShuttleTone tone;
  final double? heading;
  final double size;

  /// Overrides the tone's colour (white on a filled pill).
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final icon = Icon(Icons.airport_shuttle_rounded, size: size, color: color ?? shuttleColour(tone));
    final h = heading;
    if (h == null) return icon;
    final n = ((h % 360) + 360) % 360;
    if (n <= 180) return Transform.rotate(angle: (n - 90) * math.pi / 180, child: icon);
    return Transform.flip(flipX: true, child: Transform.rotate(angle: (270 - n) * math.pi / 180, child: icon));
  }
}

/// The map marker: a white pill bordered and tinted with the tone, with a soft halo.
class ShuttlePin extends StatelessWidget {
  const ShuttlePin({super.key, required this.tone, this.heading, this.size = 34, this.filled = false});
  final ShuttleTone tone;
  final double? heading;
  final double size;

  /// Filled with the tone (the driver's own shuttle on the pro map).
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final colour = shuttleColour(tone);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: filled ? colour : Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: filled ? Colors.white : colour, width: 2.5),
        boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Center(child: ShuttleIcon(tone: tone, heading: heading, size: size * 0.6, color: filled ? Colors.white : null)),
    );
  }
}

import 'dart:math';

import 'package:latlong2/latlong.dart';

/// Local metric frame around [origin] (equirectangular: exact enough for a parking).
class LocalFrame {
  LocalFrame(this.origin) : _kx = 111320 * cos(origin.latitude * pi / 180), _ky = 110540;

  final LatLng origin;
  final double _kx;
  final double _ky;

  Point<double> forward(LatLng p) => Point((p.longitude - origin.longitude) * _kx, (p.latitude - origin.latitude) * _ky);
  LatLng inverse(Point<double> p) => LatLng(origin.latitude + p.y / _ky, origin.longitude + p.x / _kx);
}

/// Area in m² of a polygon given by its corners (shoelace in the local frame).
double polygonAreaM2(List<LatLng> corners) {
  if (corners.length < 3) return 0;
  final frame = LocalFrame(corners.first);
  final pts = corners.map(frame.forward).toList();
  var sum = 0.0;
  for (var i = 0; i < pts.length; i++) {
    final a = pts[i];
    final b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum.abs() / 2;
}

/// Distance in metres between two points.
double distanceM(LatLng a, LatLng b) {
  final p = LocalFrame(a).forward(b);
  return sqrt(p.x * p.x + p.y * p.y);
}

/// Convex hull (monotone chain), counter-clockwise.
List<Point<double>> convexHull(List<Point<double>> pts) {
  final sorted = [...pts]..sort((a, b) => a.x != b.x ? a.x.compareTo(b.x) : a.y.compareTo(b.y));
  if (sorted.length < 3) return sorted;
  double cross(Point<double> o, Point<double> a, Point<double> b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  final lower = <Point<double>>[];
  for (final p in sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower.last, p) <= 0) {
      lower.removeLast();
    }
    lower.add(p);
  }
  final upper = <Point<double>>[];
  for (final p in sorted.reversed) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper.last, p) <= 0) {
      upper.removeLast();
    }
    upper.add(p);
  }
  return [...lower.sublist(0, lower.length - 1), ...upper.sublist(0, upper.length - 1)];
}

/// "Rectangle auto": the minimum-area rectangle around the tapped corners (rotating calipers over
/// the hull's edges), as 4 corners. Two corners give the axis-aligned rectangle they span.
List<LatLng> boundingRectangle(List<LatLng> corners) {
  if (corners.length < 2) return corners;
  final frame = LocalFrame(corners.first);
  final pts = corners.map(frame.forward).toList();
  final hull = pts.length >= 3 ? convexHull(pts) : pts;
  var best = <Point<double>>[];
  var bestArea = double.infinity;
  final angles = hull.length >= 3
      ? [for (var i = 0; i < hull.length; i++) atan2(hull[(i + 1) % hull.length].y - hull[i].y, hull[(i + 1) % hull.length].x - hull[i].x)]
      : [0.0];
  for (final a in angles) {
    final c = cos(a);
    final s = sin(a);
    double minX = double.infinity, maxX = -double.infinity, minY = double.infinity, maxY = -double.infinity;
    for (final p in pts) {
      final x = p.x * c + p.y * s;
      final y = -p.x * s + p.y * c;
      minX = min(minX, x);
      maxX = max(maxX, x);
      minY = min(minY, y);
      maxY = max(maxY, y);
    }
    final area = (maxX - minX) * (maxY - minY);
    if (area < bestArea) {
      bestArea = area;
      Point<double> back(double x, double y) => Point(x * c - y * s, x * s + y * c);
      best = [back(minX, minY), back(maxX, minY), back(maxX, maxY), back(minX, maxY)];
    }
  }
  return best.map(frame.inverse).toList();
}

/// Centre of a set of points.
LatLng centroidOf(List<LatLng> corners) {
  final lat = corners.fold<double>(0, (s, p) => s + p.latitude) / corners.length;
  final lng = corners.fold<double>(0, (s, p) => s + p.longitude) / corners.length;
  return LatLng(lat, lng);
}

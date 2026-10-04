import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:parking_app/src/core/helpers/geo_rect.dart';

void main() {
  final frame = LocalFrame(const LatLng(45.72, 5.08));
  LatLng at(double x, double y) => frame.inverse(Point(x, y));

  group('tracé du terrain', () {
    test('surface d’un rectangle de 60 × 40 m', () {
      expect(polygonAreaM2([at(0, 0), at(60, 0), at(60, 40), at(0, 40)]).round(), 2400);
      expect(polygonAreaM2([at(0, 0), at(60, 0)]), 0);
    });

    test('« Rectangle auto » entoure des coins approximatifs par le plus petit rectangle', () {
      // Four sloppy taps around a 50 × 30 m lot turned by 20°.
      final c = 0.9397, s = 0.3420;
      LatLng rot(double x, double y) => at(x * c - y * s, x * s + y * c);
      final rect = boundingRectangle([rot(1, -1), rot(49, 2), rot(51, 29), rot(-2, 31)]);
      expect(rect, hasLength(4));
      final area = polygonAreaM2(rect);
      expect(area, greaterThan(1500));
      expect(area, lessThan(1800));
      // Two taps: the axis-aligned rectangle they span.
      expect(polygonAreaM2(boundingRectangle([at(0, 0), at(20, 10)])).round(), 200);
    });

    test('distance et centre', () {
      expect(distanceM(at(0, 0), at(30, 40)).round(), 50);
      final centre = frame.forward(centroidOf([at(0, 0), at(10, 0), at(10, 10), at(0, 10)]));
      expect(centre.x, closeTo(5, 0.01));
      expect(centre.y, closeTo(5, 0.01));
    });
  });
}

import 'package:flutter/widgets.dart';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/constants/product.g.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/pro_today/data/models/staff_signal_model.dart';

import '../helpers/pump_app.dart';

void main() {
  setUpAll(setUpLocalizedTests);

  test('le nom du produit vient de product.json (seul endroit)', () {
    final product = jsonDecode(File('../product.json').readAsStringSync()) as Map<String, dynamic>;
    expect(Product.name, product['name'], reason: 'run: dart run tool/sync_product.dart');
    expect(Product.tagline, product['tagline']);
  });

  test('lit la réponse de l’API (voyageur)', () {
    final model = ArrivalModel.fromJson({
      'reference': 'R7KQ2M',
      'moment': {'kind': 'return', 'open': true, 'opensAt': '2026-10-10T13:00:00.000Z', 'closesAt': '2026-10-10T21:00:00.000Z'},
      'meetingPoint': {'lat': 45, 'lng': 5.08, 'source': 'airport', 'label': 'Lyon Saint-Exupéry'},
      'signal': {
        'kind': 'return',
        'state': 'at_meeting_point',
        'endReason': null,
        'startedAt': '2026-10-10T14:00:00.000Z',
        'expiresAt': '2026-10-10T16:00:00.000Z',
        'secondsLeft': 3600,
        'distanceM': 40,
        'etaMinutes': 0,
        'etaAt': '2026-10-10T14:05:00.000Z',
        'announcedMinutes': null,
        'atMeetingPointAt': '2026-10-10T14:05:00.000Z',
        'positionUpdatedAt': null,
      },
      'rules': {'maxMinutes': 120, 'arrivedWithinMeters': 150, 'positionIntervalSeconds': 10, 'announceMinutes': [10, 20, 30]},
    });
    expect(model.moment!.kind, ArrivalKind.returnTrip);
    expect(model.isAtMeetingPoint, isTrue);
    expect(model.meetingPoint!.lat, 45.0);
    expect(ArrivalKind.returnTrip.apiValue, 'return');
  });

  test('lit un signal du personnel avec position', () {
    final s = StaffSignalModel.fromJson({
      'id': 's1',
      'reservationId': 'r1',
      'reference': 'R1',
      'kind': 'outbound',
      'state': 'sharing',
      'customerName': 'Camille Martin',
      'plate': 'AB-123-CD',
      'passengers': 2,
      'returnFlight': null,
      'scheduledAt': '2026-10-03T06:00:00.000Z',
      'startedAt': '2026-10-03T05:30:00.000Z',
      'expiresAt': '2026-10-03T07:30:00.000Z',
      'distanceM': 8400,
      'etaMinutes': 13,
      'etaAt': '2026-10-03T05:53:00.000Z',
      'announcedMinutes': null,
      'atMeetingPointAt': null,
      'position': {'lat': 45.8, 'lng': 5.05, 'accuracyM': 12},
      'positionUpdatedAt': '2026-10-03T05:40:00.000Z',
      'positionAgeSeconds': 3,
      'meetingPoint': {'lat': 45.73, 'lng': 5.05, 'source': 'parking', 'label': null},
      'unknownFutureField': true,
    });
    expect(s.position!.accuracyM, 12);
    expect(s.state, ArrivalSignalState.sharing);
  });

  testWidgets('formats français', (tester) async {
    await pumpLocalized(tester, const SizedBox());
    expect(distanceLabel(8400), '8,4 km');
    expect(distanceLabel(320), '320 m');
    expect(durationLabel(const Duration(minutes: 112)), '1 h 52');
    expect(durationLabel(const Duration(minutes: 7, seconds: 10)), '8 min');
    expect(shortName('Camille Martin'), 'C. Martin');
    expect(localTime('2026-10-04T06:30'), '06:30');
  });
}

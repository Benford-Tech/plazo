import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/features/search/domain/logic/shuttle_rail.dart';

import '../../helpers/fakes.dart';

const parking = LatLngModel(lat: 45.7375, lng: 5.0745);
final airport = lys.location!;
const midway = LatLngModel(lat: (45.7375 + 45.7256) / 2, lng: (5.0745 + 5.0811) / 2);

LiveShuttleModel shuttle(String id, {String parking = 'moulin', LatLngModel? position, int? age}) =>
    LiveShuttleModel(id: id, parking: parking, position: position, positionAgeSeconds: age, startedAt: '2026-10-14T09:00:00Z');

AirportLiveModel live(List<LiveShuttleModel> shuttles, {LatLngModel? parkingAt = parking, LatLngModel? airportAt}) => AirportLiveModel(
  serverTime: '2026-10-14T09:10:00Z',
  airport: lys.copyWith(location: airportAt ?? lys.location),
  parkings: [LiveParkingModel(slug: 'moulin', title: 'Parking du Moulin', location: parkingAt)],
  shuttles: shuttles,
);

void main() {
  group('L3 « Le trajet en direct » : position sur le rail', () {
    test('distance parking → navette ÷ distance parking → aéroport, gardée entre 5 et 95 %', () {
      expect(railProgress(parking, airport, midway), closeTo(0.5, 0.01));
      expect(railProgress(parking, airport, parking), railMin); // at the P: 5 %
      expect(railProgress(parking, airport, airport), railMax); // at the plane: 95 %
      // Beyond the airport (or on a detour longer than the route): never past the plane.
      expect(railProgress(parking, airport, const LatLngModel(lat: 45.70, lng: 5.10)), railMax);
      // A parking at the airport itself: nothing can be measured.
      expect(railProgress(airport, airport, midway), isNull);
      expect(metresBetween(parking, airport), closeTo(1408, 20));
    });

    test('les navettes du parking seulement, la plus fraîche d’abord, trois au plus, aucune sans position', () {
      final rail = railState(
        live([
          shuttle('a', position: midway, age: 30),
          shuttle('b', position: parking, age: 8),
          shuttle('autre', parking: 'voisin', position: midway, age: 1),
          shuttle('sans-position'),
          shuttle('c', position: airport, age: 12),
          shuttle('d', position: midway, age: 50),
        ]),
        'moulin',
      );
      expect(rail.running, 5); // the one without a position runs too
      expect(rail.markers.map((m) => m.id), ['b', 'c', 'a']);
      expect(rail.markers.map((m) => m.progress), [railMin, railMax, closeTo(0.5, 0.01)]);
      expect(rail.ageSeconds, 8);
    });

    test('aucune navette en route : un rail sans minibus ni âge', () {
      final rail = railState(live(const []), 'moulin');
      expect(rail.running, 0);
      expect(rail.markers, isEmpty);
      expect(rail.ageSeconds, isNull);
      expect(railState(null, 'moulin').markers, isEmpty);
    });

    test('positions inconnues : l’entrée du parking de la recherche à défaut ; sans aéroport, pas de minibus', () {
      final noParking = live([shuttle('a', position: midway, age: 3)], parkingAt: null);
      expect(railState(noParking, 'moulin').markers, isEmpty);
      expect(railState(noParking, 'moulin', fallbackParking: parking).markers.single.progress, closeTo(0.5, 0.01));
      final noAirport = AirportLiveModel(
        serverTime: '2026-10-14T09:10:00Z',
        airport: const AirportModel(code: 'XXX', name: 'Sans position', slug: 'x'),
        parkings: const [LiveParkingModel(slug: 'moulin', title: 'Parking du Moulin', location: parking)],
        shuttles: [shuttle('a', position: midway, age: 3)],
      );
      final rail = railState(noAirport, 'moulin');
      expect(rail.markers, isEmpty);
      expect(rail.ageSeconds, 3); // the age still says the shuttle is followed
    });

    test('le minibus regarde le terminal, ou le parking quand il en revient', () {
      final data = live([shuttle('aller', position: midway, age: 3), shuttle('retour', position: midway, age: 4)]);
      // The route from the parking to the airport heads south-east; « retour » last moved north-west.
      final rail = railState(data, 'moulin', headings: {'aller': 160, 'retour': 340});
      expect(rail.markers.map((m) => m.towardsParking), [false, true]);
    });
  });
}

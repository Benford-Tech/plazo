import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_shuttle/data/datasources/shuttle_data_source.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/domain/usecases/shuttle_use_cases.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_bloc.dart';
import 'package:parking_app/src/services/location_service.dart';

import '../../helpers/fixtures.dart';

class MockPickups extends Mock implements GetPickupsUseCase {}

class MockDepartures extends Mock implements GetDeparturesUseCase {}

class MockVehicles extends Mock implements GetVehiclesUseCase {}

class MockStops extends Mock implements GetStopsUseCase {}

class MockCurrent extends Mock implements GetCurrentTripUseCase {}

class MockStart extends Mock implements StartTripUseCase {}

class MockSend extends Mock implements SendTripPositionUseCase {}

class MockEnd extends Mock implements EndTripUseCase {}

class MockLocation extends Mock implements LocationService {}

void main() {
  late MockPickups pickups;
  late MockDepartures departures;
  late MockVehicles vehicles;
  late MockStops stops;
  late MockCurrent current;
  late MockStart start;
  late MockSend send;
  late MockEnd end;
  late MockLocation location;
  late StreamController<GeoPosition> positions;
  late DateTime now;

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const StartTripParams(reservationIds: [], vehicle: TripVehicleChoice()));
    registerFallbackValue(TripPositionParams(tripId: 'x', position: position(0)));
    registerFallbackValue(LocationNotice.traveller);
  });

  setUp(() {
    pickups = MockPickups();
    departures = MockDepartures();
    vehicles = MockVehicles();
    stops = MockStops();
    when(() => stops(any())).thenAnswer((_) async => const Right([ShuttleStopModel(kind: 'airport', name: 'Terminal 1 · Porte 12', lat: 45.7205, lng: 5.0817, builtIn: true)]));
    current = MockCurrent();
    start = MockStart();
    send = MockSend();
    end = MockEnd();
    location = MockLocation();
    positions = StreamController<GeoPosition>.broadcast();
    now = t0;
    when(() => pickups(any())).thenAnswer(
      (_) async => Right(
        PickupsModel(
          serverTime: now,
          meetingPoint: meetingT1,
          rows: [
            pickup('r1', 'Camille Martin', atMeetingPointAt: t0, flight: landedFlight()),
            pickup('r2', 'Léa Durand', passengers: 1, plate: 'GH-456-JK', flight: landedFlight()),
            pickup('r3', 'Louis Leroy', passengers: 3, plate: 'LM-789-NP', terminal: 'Terminal 2'),
          ],
        ),
      ),
    );
    when(() => departures(any())).thenAnswer(
      (_) async => Right(
        DeparturesModel(
          serverTime: now,
          rows: [
            DepartureRowModel(reservationId: 'a1', reference: 'A1', customerName: 'Léa Durand', passengers: 3, plate: 'GH-456-JK', status: 'arrived', arrivalAt: t0, arrivedAt: t0, spot: 'A12'),
            DepartureRowModel(reservationId: 'a2', reference: 'A2', customerName: 'Noa Petit', passengers: 1, plate: 'AB-123-CD', status: 'arrived', arrivalAt: t0, tripId: 'other'),
          ],
        ),
      ),
    );
    when(() => vehicles(any())).thenAnswer(
      (_) async => const Right([
        ShuttleVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK', seats: 2, driverId: 'me'),
        ShuttleVehicleModel(id: 'v2', model: 'Renault Trafic', inService: false),
      ]),
    );
    when(() => current(any())).thenAnswer((_) async => const Right(null));
    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.granted);
    when(() => location.positions(background: any(named: 'background'), notice: any(named: 'notice'))).thenAnswer((_) => positions.stream);
  });

  tearDown(() => positions.close());

  ShuttleBloc build() => ShuttleBloc(pickups, departures, vehicles, stops, current, start, send, end, location, clock: () => now, autoPoll: false);
  Future<void> settle() => Future<void>.delayed(Duration.zero).then((_) => Future<void>.delayed(Duration.zero));

  Future<ShuttleBloc> opened() async {
    final bloc = build()..add(const ShuttleStarted());
    await bloc.stream.firstWhere((s) => s.pickups != null);
    return bloc;
  }

  test('ouvert depuis une fiche (C-B) : le côté et le client sont présélectionnés', () async {
    final bloc = build()..add(const ShuttleStarted(direction: 'dropoff', reservationId: 'a1'));
    await bloc.stream.firstWhere((s) => s.departures != null);
    expect(bloc.state.direction, 'dropoff');
    expect(bloc.state.selected, {'a1'});
    await bloc.close();
    // A traveller the list does not offer (already on a trip, gone) stays unselected.
    final other = build()..add(const ShuttleStarted(direction: 'pickup', reservationId: 'nope'));
    await other.stream.firstWhere((s) => s.pickups != null);
    expect(other.state.direction, 'pickup');
    expect(other.state.selected, isEmpty);
    await other.close();
  });

  test('liste les retours groupés par terminal, sans demander la position', () async {
    final bloc = await opened();
    expect(bloc.state.groups.map((g) => g.terminal), ['Terminal 1', 'Terminal 2']);
    expect(bloc.state.groups.first.rows.length, 2);
    expect(bloc.state.vehicles.length, 2);
    expect(bloc.state.availableVehicles.length, 1);
    expect(bloc.state.meetingPoint?.label, 'Terminal 1 · Porte 12');
    verifyNever(() => location.requestAccess());
    await bloc.close();
  });

  test('sélection, véhicule, démarrage : position partagée avec la notification chauffeur, au plus une fois par 10 s', () async {
    final trip = staffTrip(passengers: const [TripPassengerModel(reservationId: 'r1', reference: 'Rr1', customerName: 'Camille Martin', passengers: 2, plate: 'AB-123-CD')]);
    when(() => start(any())).thenAnswer((_) async => Right(trip));
    when(() => send(any())).thenAnswer((_) async => Right(trip.copyWith(positionUpdatedAt: now)));
    final bloc = await opened();
    bloc.add(const ShuttlePassengerToggled('r1'));
    bloc.add(const ShuttlePassengerToggled('r2'));
    bloc.add(const ShuttlePassengerToggled('r2'));
    await settle();
    expect(bloc.state.selected, {'r1'});
    // Nothing without a selection? There is one: the vehicle then the start.
    bloc.add(const ShuttleVehicleChosen(TripVehicleChoice(vehicleId: 'v1')));
    bloc.add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.tracking);
    final params = verify(() => start(captureAny())).captured.single as StartTripParams;
    expect(params.reservationIds, ['r1']);
    expect(params.vehicle.vehicleId, 'v1');
    expect(bloc.state.running, isTrue);
    expect(bloc.state.selected, isEmpty);
    final notice = verify(() => location.positions(background: true, notice: captureAny(named: 'notice'))).captured.single as LocationNotice;
    expect(notice.title, 'Trajet navette en cours — position partagée avec vos clients');

    positions.add(position(45.74));
    await settle();
    verify(() => send(any())).called(1);
    now = t0.add(const Duration(seconds: 5));
    positions.add(position(45.741));
    await settle();
    verifyNever(() => send(any()));
    now = t0.add(const Duration(seconds: 11));
    bloc.add(const ShuttleTicked());
    await settle();
    final sent = verify(() => send(captureAny())).captured.single as TripPositionParams;
    expect(sent.tripId, 't1');
    expect(sent.position.lat, 45.741);
    await bloc.close();
  });

  test('autorisation refusée : pas de trajet', () async {
    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.deniedForever);
    final bloc = await opened();
    bloc.add(const ShuttlePassengerToggled('r1'));
    bloc.add(const ShuttleStartRequested());
    await settle();
    expect(bloc.state.locationProblem, LocationAccess.deniedForever);
    verifyNever(() => start(any()));
    await bloc.close();
  });

  test('« Clients récupérés » : arrêt local immédiat, puis fin côté API ; l’erreur de l’API est traduite', () async {
    final trip = staffTrip();
    when(() => start(any())).thenAnswer((_) async => Right(trip));
    when(() => end(any())).thenAnswer((_) async => Right(trip.copyWith(status: 'ended', endReason: 'completed')));
    final bloc = await opened();
    bloc.add(const ShuttlePassengerToggled('r1'));
    bloc.add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.tracking);
    bloc.add(const ShuttleEndRequested());
    await settle();
    expect(bloc.state.tracking, isFalse);
    expect(bloc.state.trip, isNull);
    expect(bloc.state.endedNotice, isTrue);
    verify(() => end('t1')).called(1);
    positions.add(position(45.75));
    await settle();
    verifyNever(() => send(any()));

    when(() => start(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'x', statusCode: 409, code: 'trip_already_running')));
    bloc.add(const ShuttlePassengerToggled('r1'));
    bloc.add(const ShuttleStartRequested());
    await settle();
    expect(bloc.state.actionState, ViewState.error);
    expect(bloc.state.errorCode, 'trip_already_running');
    await bloc.close();
  });

  test('un trajet en cours est repris à l’ouverture, et s’arrête tout seul au bout de 90 min', () async {
    final trip = staffTrip(startedAt: t0.subtract(const Duration(minutes: 80)));
    when(() => current(any())).thenAnswer((_) async => Right(trip));
    final bloc = await opened();
    await settle();
    expect(bloc.state.running, isTrue);
    expect(bloc.state.tracking, isTrue);
    expect(bloc.state.remaining.inMinutes, 10);
    now = t0.add(const Duration(minutes: 11));
    bloc.add(const ShuttleTicked());
    await settle();
    expect(bloc.state.tracking, isFalse);
    expect(bloc.state.trip, isNull);
    expect(bloc.state.endedNotice, isTrue);
    await bloc.close();
  });

  test('le serveur a terminé le trajet (409 trip_not_running) : le partage s’arrête', () async {
    final trip = staffTrip();
    when(() => current(any())).thenAnswer((_) async => Right(trip));
    when(() => send(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'x', statusCode: 409, code: 'trip_not_running')));
    final bloc = await opened();
    await settle();
    expect(bloc.state.tracking, isTrue);
    positions.add(position(45.74));
    await settle();
    expect(bloc.state.tracking, isFalse);
    expect(bloc.state.trip, isNull);
    await bloc.close();
  });
  test('V-A · le véhicule du jour passe devant l’habituel ; D-A · la desserte choisie part avec le trajet', () async {
    when(() => vehicles(any())).thenAnswer(
      (_) async => const Right([
        ShuttleVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanche', seats: 8, driverId: 'me'),
        ShuttleVehicleModel(id: 'v3', model: 'Renault Trafic', seats: 8),
      ]),
    );
    when(() => stops(any())).thenAnswer(
      (_) async => const Right([
        ShuttleStopModel(kind: 'airport', name: 'Terminal 1', lat: 45.7205, lng: 5.0817, builtIn: true),
        ShuttleStopModel(id: 's1', kind: 'station', name: 'Gare TGV', lat: 45.7209, lng: 5.0756),
      ]),
    );
    final bloc = build()..add(const ShuttleStarted(staffId: 'me', vehicleId: 'v3'));
    await bloc.stream.firstWhere((s) => s.pickups != null);
    expect(bloc.state.vehicle?.vehicleId, 'v3');
    expect(bloc.state.hasStopChoice, isTrue);
    expect(bloc.state.stopId, isNull, reason: 'the airport by default');

    bloc.add(const ShuttleStopChanged('s1'));
    bloc.add(const ShuttlePassengerToggled('r1'));
    await settle();
    expect(bloc.state.chosenStop?.name, 'Gare TGV');
    when(() => start(any())).thenAnswer((invocation) async {
      final params = invocation.positionalArguments.single as StartTripParams;
      expect(params.stopId, 's1');
      expect(params.vehicle.vehicleId, 'v3');
      return Right(staffTrip());
    });
    bloc.add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.trip != null);
    // No changing the stop while the trip runs.
    bloc.add(const ShuttleStopChanged(null));
    await settle();
    expect(bloc.state.stopId, 's1');
    verify(() => start(any())).called(1);
    await bloc.close();
  });

  test('T-A · deux sens : « Départs · terminal » charge les arrivés, le trajet part en dropoff, et la fin', () async {
    final bloc = build()..add(const ShuttleStarted(staffId: 'me'));
    await bloc.stream.firstWhere((s) => s.pickups != null);
    // The driver's usual vehicle is preselected; the out-of-service one is not offered.
    expect(bloc.state.vehicle?.vehicleId, 'v1');
    expect(bloc.state.availableVehicles.map((v) => v.id), ['v1']);

    bloc.add(const ShuttlePassengerToggled('r1'));
    bloc.add(const ShuttleDirectionChanged('dropoff'));
    await bloc.stream.firstWhere((s) => s.departures != null);
    expect(bloc.state.dropoff, isTrue);
    expect(bloc.state.selected, isEmpty, reason: 'switching sides clears the selection');
    expect(bloc.state.selectableDepartures.map((r) => r.reservationId), ['a1']);

    // Three passengers for two seats: refused locally, nothing sent.
    bloc.add(const ShuttlePassengerToggled('a1'));
    await settle();
    expect(bloc.state.selectedPassengers, 3);
    bloc.add(const ShuttleStartRequested());
    await settle();
    expect(bloc.state.errorCode, 'too_many_passengers');
    verifyNever(() => start(any()));

    // Typed vehicle: the trip starts to the terminal.
    when(() => start(any())).thenAnswer((invocation) async {
      final params = invocation.positionalArguments.single as StartTripParams;
      expect(params.direction, 'dropoff');
      expect(params.reservationIds, ['a1']);
      return Right(staffTrip().copyWith(direction: 'dropoff'));
    });
    bloc.add(const ShuttleVehicleChosen(TripVehicleChoice(model: 'Vito')));
    bloc.add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.trip != null);
    expect(bloc.state.trip?.dropoff, isTrue);
    expect(bloc.state.tracking, isTrue);
    // No switching sides while a trip runs.
    bloc.add(const ShuttleDirectionChanged('pickup'));
    await settle();
    expect(bloc.state.direction, 'dropoff');
    await bloc.close();
  });
}

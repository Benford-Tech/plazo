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
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_boarding.dart';
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
    when(() => stops(any()))
        .thenAnswer((_) async => const Right([ShuttleStopModel(kind: 'airport', name: 'Terminal 1 · Porte 12', lat: 45.7205, lng: 5.0817, builtIn: true)]));
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
            DepartureRowModel(
              reservationId: 'a1',
              reference: 'A1',
              customerName: 'Léa Durand',
              passengers: 3,
              plate: 'GH-456-JK',
              status: 'arrived',
              arrivalAt: t0,
              arrivedAt: t0,
              spot: 'A12',
            ),
            DepartureRowModel(
              reservationId: 'a2',
              reference: 'A2',
              customerName: 'Noa Petit',
              passengers: 1,
              plate: 'AB-123-CD',
              status: 'arrived',
              arrivalAt: t0,
              tripId: 'other',
            ),
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
    when(
      () => location.positions(
        background: any(named: 'background'),
        notice: any(named: 'notice'),
      ),
    ).thenAnswer((_) => positions.stream);
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

  test('suivi désactivé par le parking (R-B) : le trajet part sans demander ni partager la position', () async {
    when(() => pickups(any())).thenAnswer(
      (_) async => Right(
        PickupsModel(
          serverTime: now,
          meetingPoint: meetingT1,
          sharePosition: false,
          rows: [pickup('r1', 'Camille Martin', flight: landedFlight())],
        ),
      ),
    );
    final trip = staffTrip(
      passengers: const [TripPassengerModel(reservationId: 'r1', reference: 'Rr1', customerName: 'Camille Martin', passengers: 2, plate: 'AB-123-CD')],
    ).copyWith(sharePosition: false);
    when(() => start(any())).thenAnswer((_) async => Right(trip));
    final bloc = await opened();
    expect(bloc.state.sharePosition, isFalse);
    bloc.add(const ShuttlePassengerToggled('r1'));
    bloc.add(const ShuttleVehicleChosen(TripVehicleChoice(vehicleId: 'v1')));
    bloc.add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.running);
    await settle();
    expect(bloc.state.tracking, isFalse);
    expect(bloc.state.sharePosition, isFalse);
    verifyNever(() => location.requestAccess());
    verifyNever(
      () => location.positions(
        background: any(named: 'background'),
        notice: any(named: 'notice'),
      ),
    );
    verifyNever(() => send(any()));
    await bloc.close();
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
    final trip = staffTrip(
      passengers: const [TripPassengerModel(reservationId: 'r1', reference: 'Rr1', customerName: 'Camille Martin', passengers: 2, plate: 'AB-123-CD')],
    );
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

  test('Ligne du jour vers le terminal : un client encore attendu est présélectionné et envoyé, pas un client d\'un autre trajet (14/10/2026)', () async {
    when(() => departures(any())).thenAnswer(
      (_) async => Right(
        DeparturesModel(
          serverTime: now,
          rows: [
            DepartureRowModel(
              reservationId: 'a1',
              reference: 'A1',
              customerName: 'Léa Durand',
              passengers: 1,
              plate: 'GH-456-JK',
              status: 'arrived',
              arrivalAt: t0,
              arrivedAt: t0,
              spot: 'A12',
            ),
            DepartureRowModel(
              reservationId: 'a2',
              reference: 'A2',
              customerName: 'Noa Petit',
              passengers: 1,
              plate: 'AB-123-CD',
              status: 'arrived',
              arrivalAt: t0,
              tripId: 'other',
            ),
            DepartureRowModel(
              reservationId: 'a3',
              reference: 'A3',
              customerName: 'Nadia Roux',
              passengers: 1,
              plate: 'NR-321-ZZ',
              status: 'upcoming',
              arrivalAt: t0,
              expected: true,
            ),
          ],
        ),
      ),
    );
    final bloc = build()..add(const ShuttleStarted());
    await bloc.stream.firstWhere((s) => s.pickups != null);
    // « Démarrer ce trajet » on a wave that holds an arrived traveller, one still expected and one on another trip.
    bloc.add(const ShuttleWaveChosen(direction: 'dropoff', reservationIds: ['a1', 'a3', 'a2']));
    await bloc.stream.firstWhere((s) => s.departures != null && s.selected.isNotEmpty);
    expect(bloc.state.selected, {'a1', 'a3'});
    expect(bloc.state.selectedNotCheckedIn.map((r) => r.reservationId), ['a3']);

    // Opened from the expected traveller's sheet: they are selected; from the one on another trip: not.
    final other = build()..add(const ShuttleStarted(direction: 'dropoff', reservationId: 'a3'));
    await other.stream.firstWhere((s) => s.departures != null);
    await settle();
    expect(other.state.selected, {'a3'});
    await other.close();
    final busy = build()..add(const ShuttleStarted(direction: 'dropoff', reservationId: 'a2'));
    await busy.stream.firstWhere((s) => s.departures != null);
    await settle();
    expect(busy.state.selected, isEmpty);
    expect(busy.state.errorCode, 'already_on_trip');
    await busy.close();

    when(() => start(any())).thenAnswer((invocation) async {
      final params = invocation.positionalArguments.single as StartTripParams;
      expect(params.reservationIds, ['a1', 'a3']);
      return Right(staffTrip().copyWith(direction: 'dropoff'));
    });
    bloc.add(const ShuttleVehicleChosen(TripVehicleChoice(model: 'Vito')));
    bloc.add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.trip != null);
    verify(() => start(any())).called(1);
    await bloc.close();
  });

  test('À emmener (14/10/2026) : un client attendu se coche comme les autres, un client d\'un autre trajet non', () async {
    when(() => departures(any())).thenAnswer(
      (_) async => Right(
        DeparturesModel(
          serverTime: now,
          rows: [
            DepartureRowModel(reservationId: 'a1', reference: 'A1', customerName: 'Léa Durand', passengers: 1, plate: 'GH-456-JK', status: 'arrived', arrivalAt: t0, arrivedAt: t0),
            DepartureRowModel(reservationId: 'a2', reference: 'A2', customerName: 'Noa Petit', passengers: 1, plate: 'AB-123-CD', status: 'arrived', arrivalAt: t0, tripId: 'other'),
            DepartureRowModel(reservationId: 'a3', reference: 'A3', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', status: 'upcoming', arrivalAt: t0, expected: true),
            DepartureRowModel(reservationId: 'a4', reference: 'A4', customerName: 'Sarah Cohen', passengers: 2, plate: 'KL-204-BA', status: 'upcoming', arrivalAt: t0, expected: true),
          ],
        ),
      ),
    );
    final bloc = build()..add(const ShuttleStarted(direction: 'dropoff'));
    await bloc.stream.firstWhere((s) => s.departures != null);
    expect(bloc.state.selectableDepartures.map((r) => r.reservationId), ['a1', 'a3', 'a4']);
    bloc
      ..add(const ShuttlePassengerToggled('a1'))
      ..add(const ShuttlePassengerToggled('a3'));
    await settle();
    expect(bloc.state.selectedNotCheckedIn.map((r) => r.customerName), ['Vincent Blanc']);
    bloc.add(const ShuttlePassengerToggled('a4'));
    await settle();
    expect(bloc.state.selectedNotCheckedIn.length, 2);
    expect(bloc.state.selectedPassengers, 4);
    await bloc.close();
  });

  test('un geste (14/10/2026) : avec le véhicule du jour en service, le trajet part sans feuille ; « Changer » le remplace', () async {
    when(() => vehicles(any())).thenAnswer(
      (_) async => const Right([
        ShuttleVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanche', seats: 8, driverId: 'me'),
        ShuttleVehicleModel(id: 'v2', model: 'Renault Trafic', inService: false),
        ShuttleVehicleModel(id: 'v3', model: 'Vito', colour: 'blanc', plate: 'GH-456-JK', seats: 8),
      ]),
    );
    final params = <StartTripParams>[];
    when(() => start(any())).thenAnswer((invocation) async {
      params.add(invocation.positionalArguments.single as StartTripParams);
      return Right(staffTrip());
    });
    final bloc = build()..add(const ShuttleStarted(staffId: 'me', vehicleId: 'v3'));
    await bloc.stream.firstWhere((s) => s.pickups != null);
    expect(bloc.state.oneTapStart, isTrue);
    expect(bloc.state.chosenVehicle?.id, 'v3');
    bloc
      ..add(const ShuttlePassengerToggled('r1'))
      ..add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.trip != null);
    expect(params.single.vehicle.vehicleId, 'v3');
    await bloc.close();

    // « Changer » : the vehicle picked on the sheet goes with the start.
    final changed = build()..add(const ShuttleStarted(staffId: 'me', vehicleId: 'v3'));
    await changed.stream.firstWhere((s) => s.pickups != null);
    changed
      ..add(const ShuttlePassengerToggled('r1'))
      ..add(const ShuttleVehicleChosen(TripVehicleChoice(vehicleId: 'v1')))
      ..add(const ShuttleStartRequested());
    await changed.stream.firstWhere((s) => s.trip != null);
    expect(params.last.vehicle.vehicleId, 'v1');
    expect(changed.state.oneTapStart, isTrue, reason: 'the vehicle of the day is still held');
    await changed.close();

    // A vehicle of the day out of service: the sheet, as before.
    final out = build()..add(const ShuttleStarted(staffId: 'me', vehicleId: 'v2'));
    await out.stream.firstWhere((s) => s.pickups != null);
    expect(out.state.oneTapStart, isFalse);
    expect(out.state.vehicle?.vehicleId, 'v1', reason: 'the usual vehicle is preselected');
    // Plus › Mon véhicule while the tab is open: the one-tap start follows.
    out.add(const ShuttleDayVehicleChanged('v3'));
    await settle();
    expect(out.state.oneTapStart, isTrue);
    expect(out.state.vehicle?.vehicleId, 'v3');
    out.add(const ShuttleDayVehicleChanged(null));
    await settle();
    expect(out.state.oneTapStart, isFalse);
    await out.close();
  });

  test('depuis le planning (14/10/2026) : « Embarquer » ouvre le côté terminal, ajoute le client à la sélection, épingle un client hors liste', () async {
    final requests = ShuttleBoardingRequests();
    final bloc = ShuttleBloc(pickups, departures, vehicles, stops, current, start, send, end, location, boarding: requests, clock: () => now, autoPoll: false)
      ..add(const ShuttleStarted());
    await bloc.stream.firstWhere((s) => s.pickups != null);
    await settle();
    expect(bloc.state.direction, 'pickup');

    // An early traveller the list does not hold: their planning row stands in.
    final early = DepartureRowModel(
      reservationId: 'p1',
      reference: 'P1',
      customerName: 'Vincent Blanc',
      passengers: 1,
      plate: 'DJ-150-MX',
      status: 'upcoming',
      arrivalAt: t0.add(const Duration(hours: 9)),
      expected: true,
    );
    requests.request(ShuttleBoarding.dropoff(early));
    await bloc.stream.firstWhere((s) => s.selected.contains('p1'));
    expect(bloc.state.direction, 'dropoff');
    expect(bloc.state.band, 0);
    expect(bloc.state.pinnedDepartures.map((r) => r.reservationId), ['p1']);
    expect(bloc.state.departureRows.map((r) => r.reservationId), ['a1', 'a2', 'p1']);
    expect(bloc.state.selectedNotCheckedIn.single.customerName, 'Vincent Blanc');

    // A second one, listed: added to the selection, the first kept.
    requests.request(ShuttleBoarding.dropoff(DepartureRowModel(reservationId: 'a1', reference: 'A1', customerName: 'Léa Durand', passengers: 3, plate: 'GH-456-JK', status: 'arrived', arrivalAt: t0)));
    await bloc.stream.firstWhere((s) => s.selected.contains('a1'));
    expect(bloc.state.selected, {'p1', 'a1'});
    expect(bloc.state.pinnedDepartures.length, 1, reason: 'the list holds a1 already');

    // A poll keeps the pinned row and its tick.
    bloc.add(const ShuttlePolled());
    await settle();
    expect(bloc.state.selected, {'p1', 'a1'});
    expect(bloc.state.pinnedDepartures.single.reservationId, 'p1');

    // One on another trip is not added.
    requests.request(ShuttleBoarding.dropoff(DepartureRowModel(reservationId: 'a2', reference: 'A2', customerName: 'Noa Petit', passengers: 1, plate: 'AB-123-CD', status: 'arrived', arrivalAt: t0)));
    await bloc.stream.firstWhere((s) => s.errorCode == 'already_on_trip');
    expect(bloc.state.selected, {'p1', 'a1'});

    // Unticked, the pinned row leaves.
    bloc.add(const ShuttlePassengerToggled('p1'));
    await settle();
    expect(bloc.state.pinnedDepartures, isEmpty);
    expect(bloc.state.selected, {'a1'});

    // Ticked again from the planning, then the trip starts: both go, the pinned row leaves.
    requests.request(ShuttleBoarding.dropoff(early));
    await bloc.stream.firstWhere((s) => s.selected.contains('p1'));
    when(() => start(any())).thenAnswer((invocation) async {
      final params = invocation.positionalArguments.single as StartTripParams;
      expect(params.direction, 'dropoff');
      expect(params.reservationIds.toSet(), {'a1', 'p1'});
      return Right(
        staffTrip(
          passengers: const [
            TripPassengerModel(reservationId: 'a1', reference: 'A1', customerName: 'Léa Durand', passengers: 3, plate: 'GH-456-JK'),
            TripPassengerModel(reservationId: 'p1', reference: 'P1', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', checkedInAtBoarding: true),
          ],
        ).copyWith(direction: 'dropoff'),
      );
    });
    bloc.add(const ShuttleVehicleChosen(TripVehicleChoice(model: 'Vito')));
    bloc.add(const ShuttleStartRequested());
    await bloc.stream.firstWhere((s) => s.trip != null);
    await settle();
    expect(bloc.state.pinnedDepartures, isEmpty);
    expect(bloc.state.selected, isEmpty);
    expect(bloc.state.checkedInAtBoarding, 1);
    // The planning learns who rides the trip: no « Embarquer » for them.
    expect(requests.onTrip.value, containsAll(['a1', 'p1', 'a2']));
    await bloc.close();
  });

  test('depuis le planning (14/10/2026) : « Récupérer » ouvre le côté retours ; une demande faite avant l\'ouverture de la liste est reprise', () async {
    final requests = ShuttleBoardingRequests();
    // The Navette tab was not built yet: the request waits.
    requests.request(ShuttleBoarding.pickup(PickupRowModel(reservationId: 'q1', reference: 'Q1', customerName: 'Marc Petit', passengers: 1, plate: 'AZ-902-LC', status: 'shuttled_out', returnAt: t0.add(const Duration(hours: 20)))));
    final bloc = ShuttleBloc(pickups, departures, vehicles, stops, current, start, send, end, location, boarding: requests, clock: () => now, autoPoll: false)
      ..add(const ShuttleStarted(direction: 'dropoff'));
    await bloc.stream.firstWhere((s) => s.selected.contains('q1'));
    expect(bloc.state.direction, 'pickup');
    expect(bloc.state.pinnedPickups.single.reservationId, 'q1');
    expect(bloc.state.pickupRows.length, 4);
    expect(requests.take(), isNull, reason: 'taken once');
    // A listed return, from the planning: added, the pinned one kept.
    requests.request(ShuttleBoarding.pickup(pickup('r2', 'Léa Durand')));
    await bloc.stream.firstWhere((s) => s.selected.contains('r2'));
    expect(bloc.state.selected, {'q1', 'r2'});
    expect(bloc.state.selectedPassengers, 2);
    await bloc.close();
  });

  test('depuis le planning, pendant mon trajet (14/10/2026) : la demande dit qu\'un trajet est en cours ; le planning le sait', () async {
    final requests = ShuttleBoardingRequests();
    final trip = staffTrip(passengers: const [TripPassengerModel(reservationId: 'a1', reference: 'A1', customerName: 'Léa Durand', passengers: 3, plate: 'GH-456-JK')]).copyWith(direction: 'dropoff');
    when(() => current(any())).thenAnswer((_) async => Right(trip));
    final bloc = ShuttleBloc(pickups, departures, vehicles, stops, current, start, send, end, location, boarding: requests, clock: () => now, autoPoll: false)
      ..add(const ShuttleStarted());
    await bloc.stream.firstWhere((s) => s.departures != null);
    await settle();
    expect(bloc.state.running, isTrue);
    expect(requests.running.value, isTrue, reason: 'the planning offers no « Embarquer » meanwhile');

    requests.request(ShuttleBoarding.dropoff(DepartureRowModel(reservationId: 'p1', reference: 'P1', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', status: 'upcoming', arrivalAt: t0, expected: true)));
    await bloc.stream.firstWhere((s) => s.errorCode == 'trip_already_running');
    expect(bloc.state.band, 1, reason: 'said on « En route », with the trip to end');
    expect(bloc.state.selected, isEmpty);
    expect(bloc.state.pinnedDepartures, isEmpty);

    // The trip ends: the planning offers the buttons again.
    when(() => end(any())).thenAnswer((_) async => Right(trip.copyWith(status: 'ended', endReason: 'completed')));
    bloc.add(const ShuttleEndRequested());
    await bloc.stream.firstWhere((s) => s.trip == null);
    await settle();
    expect(requests.running.value, isFalse);
    await bloc.close();
  });

  test('depuis le planning (14/10/2026) : le client épinglé se range sous sa desserte ; un retour garde son vol', () async {
    when(() => stops(any())).thenAnswer(
      (_) async => const Right([
        ShuttleStopModel(kind: 'airport', name: 'Terminal 1 · Porte 12', lat: 45.7205, lng: 5.0817, builtIn: true),
        ShuttleStopModel(id: 's1', kind: 'station', name: 'Gare TGV', lat: 45.72, lng: 5.07),
      ]),
    );
    final requests = ShuttleBoardingRequests();
    final bloc = ShuttleBloc(pickups, departures, vehicles, stops, current, start, send, end, location, boarding: requests, clock: () => now, autoPoll: false)
      ..add(const ShuttleStarted(direction: 'dropoff'));
    await bloc.stream.firstWhere((s) => s.departures != null);
    await settle();
    requests.request(
      ShuttleBoarding.dropoff(DepartureRowModel(reservationId: 'p1', reference: 'P1', customerName: 'Marc Petit', passengers: 1, plate: 'AZ-902-LC', status: 'upcoming', arrivalAt: t0, stopId: 's1', expected: true)),
    );
    await bloc.stream.firstWhere((s) => s.selected.contains('p1'));
    expect(bloc.state.pinnedDepartures.single.stopName, 'Gare TGV');
    expect(bloc.state.tourGroups.map((g) => g.stop), containsAll(['', 'Gare TGV']));
    expect(bloc.state.tourGroups.firstWhere((g) => g.stop == 'Gare TGV').departures.single.reservationId, 'p1');
    await bloc.close();
  });

  group('départ refusé avec un client épinglé (14/10/2026)', () {
    final early = DepartureRowModel(reservationId: 'p1', reference: 'P1', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', status: 'upcoming', arrivalAt: t0.add(const Duration(hours: 5)), expected: true);

    Future<ShuttleBloc> withPin(ShuttleBoardingRequests requests) async {
      final bloc = ShuttleBloc(pickups, departures, vehicles, stops, current, start, send, end, location, boarding: requests, clock: () => now, autoPoll: false)
        ..add(const ShuttleStarted(direction: 'dropoff'));
      await bloc.stream.firstWhere((s) => s.departures != null);
      await settle();
      requests.request(ShuttleBoarding.dropoff(early));
      await bloc.stream.firstWhere((s) => s.selected.contains('p1'));
      bloc.add(const ShuttlePassengerToggled('a1'));
      bloc.add(const ShuttleVehicleChosen(TripVehicleChoice(model: 'Vito')));
      await settle();
      expect(bloc.state.selected, {'p1', 'a1'});
      return bloc;
    }

    test('la liste relue n\'explique rien : le client épinglé (annulé depuis) quitte la sélection, nommé sous l\'erreur', () async {
      final bloc = await withPin(ShuttleBoardingRequests());
      when(() => start(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'x', statusCode: 422, code: 'invalid_passengers')));
      bloc.add(const ShuttleStartRequested());
      await bloc.stream.firstWhere((s) => s.unpinned.isNotEmpty);
      expect(bloc.state.errorCode, 'invalid_passengers', reason: 'the existing message stays');
      expect(bloc.state.unpinned, ['Vincent Blanc']);
      expect(bloc.state.selected, {'a1'});
      expect(bloc.state.pinnedDepartures, isEmpty);
      verify(() => departures(any())).called(2);

      // The next tap starts with the others; the names go with the error.
      when(() => start(any())).thenAnswer((_) async => Right(staffTrip().copyWith(direction: 'dropoff')));
      bloc.add(const ShuttleStartRequested());
      await bloc.stream.firstWhere((s) => s.trip != null);
      expect(bloc.state.unpinned, isEmpty);
      final params = verify(() => start(captureAny())).captured.last as StartTripParams;
      expect(params.reservationIds, ['a1']);
      await bloc.close();
    });

    test('deux clients ajoutés à la main (planning, « Déposer au terminal » de la fiche) : tous deux retirés et nommés', () async {
      final requests = ShuttleBoardingRequests();
      final bloc = await withPin(requests);
      // An arrived traveller the list does not hold (arrived more than 6 h ago), added from the booking's sheet: the
      // row reads like the server's (arrival recorded, the spot's code).
      final arrivedAt = t0.subtract(const Duration(hours: 8));
      requests.request(
        ShuttleBoarding.dropoff(
          DepartureRowModel(reservationId: 'p2', reference: 'P2', customerName: 'Sarah Cohen', passengers: 2, plate: 'EF-321-GH', status: 'arrived', arrivalAt: arrivedAt, arrivedAt: arrivedAt, spot: 'B04'),
        ),
      );
      await bloc.stream.firstWhere((s) => s.selected.contains('p2'));
      final added = bloc.state.departureRows.firstWhere((r) => r.reservationId == 'p2');
      expect(added.arrivedAt, arrivedAt);
      expect(added.spot, 'B04');
      expect(added.expected, isFalse);

      when(() => start(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'x', statusCode: 422, code: 'invalid_passengers')));
      bloc.add(const ShuttleStartRequested());
      await bloc.stream.firstWhere((s) => s.unpinned.isNotEmpty);
      expect(bloc.state.unpinned, ['Vincent Blanc', 'Sarah Cohen']);
      expect(bloc.state.selected, {'a1'});
      expect(bloc.state.pinnedDepartures, isEmpty);
      await bloc.close();
    });

    test('« Embarquer » pendant un départ en cours : attend son issue, puis dit que le trajet est parti', () async {
      final requests = ShuttleBoardingRequests();
      final bloc = await withPin(requests);
      final pending = Completer<Either<Failure, StaffTripModel>>();
      when(() => start(any())).thenAnswer((_) => pending.future);
      bloc.add(const ShuttleStartRequested());
      await bloc.stream.firstWhere((s) => s.actionState.isProcessing);
      final late = DepartureRowModel(reservationId: 'p3', reference: 'P3', customerName: 'Marc Petit', passengers: 1, plate: 'AZ-902-LC', status: 'upcoming', arrivalAt: t0.add(const Duration(hours: 1)), expected: true);
      requests.request(ShuttleBoarding.dropoff(late));
      await settle();
      // The start keeps its spinner; the traveller waits for its outcome instead of being ticked, then wiped.
      expect(bloc.state.actionState.isProcessing, isTrue);
      expect(bloc.state.selected, isNot(contains('p3')));

      pending.complete(Right(staffTrip().copyWith(direction: 'dropoff')));
      await bloc.stream.firstWhere((s) => s.errorCode == 'trip_already_running');
      expect(bloc.state.trip, isNotNull);
      expect(bloc.state.band, 1);
      final params = verify(() => start(captureAny())).captured.single as StartTripParams;
      expect(params.reservationIds, isNot(contains('p3')));
      await bloc.close();
    });

    test('la liste relue explique le refus (un client listé parti sur un autre trajet) : le client épinglé reste coché', () async {
      final bloc = await withPin(ShuttleBoardingRequests());
      when(() => start(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'x', statusCode: 409, code: 'already_on_trip')));
      when(() => departures(any())).thenAnswer(
        (_) async => Right(
          DeparturesModel(
            serverTime: now,
            rows: [DepartureRowModel(reservationId: 'a1', reference: 'A1', customerName: 'Léa Durand', passengers: 3, plate: 'GH-456-JK', status: 'arrived', arrivalAt: t0, tripId: 'other')],
          ),
        ),
      );
      bloc.add(const ShuttleStartRequested());
      await bloc.stream.firstWhere((s) => s.departures!.rows.length == 1);
      await settle();
      expect(bloc.state.errorCode, 'already_on_trip');
      expect(bloc.state.unpinned, isEmpty);
      expect(bloc.state.pinnedDepartures.single.reservationId, 'p1');
      expect(bloc.state.selected, contains('p1'));
      await bloc.close();
    });
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

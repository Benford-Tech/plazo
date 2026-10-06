import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/arrival/domain/usecases/announce_arrival_use_case.dart';
import 'package:parking_app/src/features/arrival/domain/usecases/at_meeting_point_use_case.dart';
import 'package:parking_app/src/features/arrival/domain/usecases/get_arrival_use_case.dart';
import 'package:parking_app/src/features/arrival/domain/usecases/send_position_use_case.dart';
import 'package:parking_app/src/features/arrival/domain/usecases/start_sharing_use_case.dart';
import 'package:parking_app/src/features/arrival/domain/usecases/stop_sharing_use_case.dart';
import 'package:parking_app/src/features/arrival/presentation/bloc/arrival_bloc.dart';
import 'package:parking_app/src/services/location_service.dart';

import '../../helpers/fixtures.dart';

class MockGet extends Mock implements GetArrivalUseCase {}

class MockStart extends Mock implements StartSharingUseCase {}

class MockSend extends Mock implements SendPositionUseCase {}

class MockAnnounce extends Mock implements AnnounceArrivalUseCase {}

class MockAtPoint extends Mock implements AtMeetingPointUseCase {}

class MockStop extends Mock implements StopSharingUseCase {}

class MockLocation extends Mock implements LocationService {}

Either<Failure, ArrivalModel> ok(ArrivalModel a) => Right(a);
Either<Failure, ArrivalModel> fail(String code) => Left(ServerFailure(code: code, statusCode: 409));

void main() {
  late MockGet get;
  late MockStart start;
  late MockSend send;
  late MockAnnounce announce;
  late MockAtPoint atPoint;
  late MockStop stop;
  late MockLocation location;
  late StreamController<GeoPosition> positions;
  late DateTime now;

  setUpAll(() {
    registerFallbackValue(const StartSharingParams(reference: 'R', kind: ArrivalKind.outbound));
    registerFallbackValue(SendPositionParams(reference: 'R', position: position(45)));
    registerFallbackValue(const AnnounceParams(reference: 'R', kind: ArrivalKind.outbound, minutes: 10));
    registerFallbackValue(const AtMeetingPointParams(reference: 'R', kind: ArrivalKind.outbound));
    registerFallbackValue(const StopSharingParams(reference: 'R'));
  });

  setUp(() {
    get = MockGet();
    start = MockStart();
    send = MockSend();
    announce = MockAnnounce();
    atPoint = MockAtPoint();
    stop = MockStop();
    location = MockLocation();
    positions = StreamController<GeoPosition>.broadcast();
    now = t0;
    when(() => get(any())).thenAnswer((_) async => ok(arrival()));
    when(() => location.positions(background: any(named: 'background'))).thenAnswer((_) => positions.stream);
    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.granted);
  });

  tearDown(() => positions.close());

  ArrivalBloc build() => ArrivalBloc(get, start, send, announce, atPoint, stop, location, clock: () => now, autoTick: false);

  /// Opens the booking's block and waits for it.
  Future<ArrivalBloc> opened() async {
    final bloc = build()..add(const ArrivalOpened('r7kq2m'));
    await bloc.stream.firstWhere((s) => s.arrival != null);
    return bloc;
  }

  Future<void> settle() => Future<void>.delayed(Duration.zero).then((_) => Future<void>.delayed(Duration.zero));

  group('consentement', () {
    test('sans consentement : ni demande d’autorisation, ni appel', () async {
      final bloc = await opened();
      bloc.add(const ArrivalShareRequested(consent: false));
      await settle();
      expect(bloc.state.errorCode, 'consent_required');
      expect(bloc.state.tracking, isFalse);
      verifyNever(() => location.requestAccess());
      verifyNever(() => start(any()));
      await bloc.close();
    });

    test('l’ouverture du bloc ne demande jamais la position', () async {
      final bloc = await opened();
      verifyNever(() => location.requestAccess());
      verifyNever(() => location.positions(background: any(named: 'background')));
      expect(bloc.state.openKind, ArrivalKind.outbound);
      await bloc.close();
    });

    test('autorisation refusée : pas de partage, on propose de prévenir sans position', () async {
      when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.denied);
      final bloc = await opened();
      bloc.add(const ArrivalShareRequested(consent: true));
      await settle();
      expect(bloc.state.locationProblem, LocationAccess.denied);
      verifyNever(() => start(any()));
      await bloc.close();
    });
  });

  group('partage', () {
    test('démarre, envoie au plus une position toutes les 10 s, la plus récente', () async {
      when(() => start(any())).thenAnswer((_) async => ok(arrival(signal: signal())));
      when(() => send(any())).thenAnswer((_) async => ok(arrival(signal: signal(etaMinutes: 13, distanceM: 8400))));
      final bloc = await opened();
      bloc.add(const ArrivalShareRequested(consent: true));
      await bloc.stream.firstWhere((s) => s.tracking);
      verify(() => start(const StartSharingParams(reference: 'R7KQ2M', kind: ArrivalKind.outbound))).called(1);

      positions.add(position(45.80));
      await settle();
      expect(bloc.state.signal?.etaMinutes, 13);

      // Two more within the same 10 s: none goes out yet, the newest waits.
      now = t0.add(const Duration(seconds: 4));
      positions.add(position(45.79));
      now = t0.add(const Duration(seconds: 6));
      positions.add(position(45.78));
      await settle();
      verify(() => send(any())).called(1);
      expect(bloc.state.lastPosition?.lat, 45.78);

      now = t0.add(const Duration(seconds: 11));
      bloc.add(const ArrivalTicked());
      await settle();
      final sent = verify(() => send(captureAny())).captured.single as SendPositionParams;
      expect(sent.position.lat, 45.78);
      await bloc.close();
    });

    test('s’arrête tout seul quand le serveur dit « au point de rendez-vous » (150 m)', () async {
      when(() => start(any())).thenAnswer((_) async => ok(arrival(signal: signal())));
      when(() => send(any())).thenAnswer((_) async => ok(arrival(signal: signal(state: ArrivalSignalState.atMeetingPoint, etaMinutes: 0))));
      final bloc = await opened();
      bloc.add(const ArrivalShareRequested(consent: true));
      await bloc.stream.firstWhere((s) => s.tracking);
      expect(positions.hasListener, isTrue);

      positions.add(position(45.7310));
      await settle();
      expect(bloc.state.tracking, isFalse);
      expect(bloc.state.lastPosition, isNull);
      expect(bloc.state.arrival!.isAtMeetingPoint, isTrue);
      expect(positions.hasListener, isFalse);
      await bloc.close();
    });

    test('s’arrête au bout de 2 h, même sans réponse du serveur', () async {
      when(() => start(any())).thenAnswer((_) async => ok(arrival(signal: signal())));
      final bloc = await opened();
      bloc.add(const ArrivalShareRequested(consent: true));
      await bloc.stream.firstWhere((s) => s.tracking);

      now = t0.add(const Duration(hours: 1, minutes: 59));
      bloc.add(const ArrivalTicked());
      await settle();
      expect(bloc.state.tracking, isTrue);
      expect(bloc.state.remaining, const Duration(minutes: 1));

      when(() => get(any())).thenAnswer((_) async => ok(arrival(signal: signal(state: ArrivalSignalState.ended, endReason: 'expired'))));
      now = t0.add(const Duration(hours: 2));
      bloc.add(const ArrivalTicked());
      await settle();
      expect(bloc.state.tracking, isFalse);
      expect(bloc.state.remaining, Duration.zero);
      expect(positions.hasListener, isFalse);
      expect(bloc.state.signal?.endReason, 'expired');
      await bloc.close();
    });

    test('« not_sharing » (arrêté ailleurs) coupe le suivi', () async {
      when(() => start(any())).thenAnswer((_) async => ok(arrival(signal: signal())));
      when(() => send(any())).thenAnswer((_) async => fail('not_sharing'));
      final bloc = await opened();
      bloc.add(const ArrivalShareRequested(consent: true));
      await bloc.stream.firstWhere((s) => s.tracking);
      positions.add(position(45.8));
      await settle();
      expect(bloc.state.tracking, isFalse);
      expect(positions.hasListener, isFalse);
      await bloc.close();
    });

    test('« Arrêter le partage » coupe le suivi avant d’appeler le serveur', () async {
      when(() => start(any())).thenAnswer((_) async => ok(arrival(signal: signal())));
      when(() => stop(any())).thenAnswer((_) async => ok(arrival(signal: signal(state: ArrivalSignalState.ended, endReason: 'stopped'))));
      final bloc = await opened();
      bloc.add(const ArrivalShareRequested(consent: true));
      await bloc.stream.firstWhere((s) => s.tracking);
      bloc.add(const ArrivalStopRequested());
      await settle();
      expect(positions.hasListener, isFalse);
      expect(bloc.state.tracking, isFalse);
      verify(() => stop(const StopSharingParams(reference: 'R7KQ2M', kind: ArrivalKind.outbound))).called(1);
      expect(bloc.state.signal?.state, ArrivalSignalState.ended);
      await bloc.close();
    });

    test('reprend un partage en cours au retour dans l’application', () async {
      when(() => get(any())).thenAnswer((_) async => ok(arrival(signal: signal())));
      final bloc = await opened();
      await settle();
      expect(bloc.state.tracking, isTrue);
      expect(positions.hasListener, isTrue);
      await bloc.close();
    });
  });

  group('sans partage', () {
    blocTest<ArrivalBloc, ArrivalState>(
      '« J’arrive dans 20 min »',
      build: build,
      setUp: () => when(() => announce(any())).thenAnswer((_) async => ok(arrival(signal: signal(state: ArrivalSignalState.announced, announcedMinutes: 20)))),
      act: (bloc) async {
        bloc.add(const ArrivalOpened('R7KQ2M'));
        await bloc.stream.firstWhere((s) => s.arrival != null);
        bloc
          ..add(const ArrivalAnnounceToggled())
          ..add(const ArrivalNoteChanged(' 2 enfants, poussette '))
          ..add(const ArrivalAnnounced(20));
      },
      verify: (bloc) {
        // E: the typed word travels with the signal, trimmed.
        verify(() => announce(const AnnounceParams(reference: 'R7KQ2M', kind: ArrivalKind.outbound, minutes: 20, note: '2 enfants, poussette'))).called(1);
        expect(bloc.state.showAnnounceOptions, isFalse);
        expect(bloc.state.signal?.announcedMinutes, 20);
        verifyNever(() => location.requestAccess());
      },
    );

    test('au retour : « Je suis au point de rendez-vous », avec la position seulement si demandé', () async {
      when(() => get(any())).thenAnswer((_) async => ok(arrival(kind: ArrivalKind.returnTrip)));
      when(() => atPoint(any())).thenAnswer((_) async => ok(arrival(kind: ArrivalKind.returnTrip, signal: signal(kind: ArrivalKind.returnTrip, state: ArrivalSignalState.atMeetingPoint))));
      when(() => location.current()).thenAnswer((_) async => position(45.7256));
      final bloc = await opened();

      bloc.add(const ArrivalAtMeetingPointRequested());
      await settle();
      verifyNever(() => location.requestAccess());
      expect((verify(() => atPoint(captureAny())).captured.single as AtMeetingPointParams).position, isNull);

      bloc.add(const ArrivalAtMeetingPointRequested(withPosition: true));
      await settle();
      final params = verify(() => atPoint(captureAny())).captured.single as AtMeetingPointParams;
      expect(params.kind, ArrivalKind.returnTrip);
      expect(params.position?.lat, 45.7256);
      await bloc.close();
    });

    test('hors fenêtre : aucune action', () async {
      when(() => get(any())).thenAnswer((_) async => ok(arrival(open: false)));
      final bloc = await opened();
      bloc
        ..add(const ArrivalShareRequested(consent: true))
        ..add(const ArrivalAnnounced(10));
      await settle();
      verifyNever(() => location.requestAccess());
      verifyNever(() => start(any()));
      verifyNever(() => announce(any()));
      await bloc.close();
    });
  });
}

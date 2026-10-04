import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/pro_today/data/models/planning_model.dart';
import 'package:parking_app/src/features/pro_today/data/models/staff_signal_model.dart';
import 'package:parking_app/src/features/pro_today/domain/usecases/get_live_arrivals_use_case.dart';
import 'package:parking_app/src/features/pro_today/domain/usecases/get_planning_use_case.dart';
import 'package:parking_app/src/features/pro_today/presentation/bloc/pro_today_bloc.dart';

import '../../helpers/fixtures.dart';

class MockPlanning extends Mock implements GetPlanningUseCase {}

class MockLive extends Mock implements GetLiveArrivalsUseCase {}

void main() {
  late MockPlanning planning;
  late MockLive live;
  late DateTime now;
  var signals = <StaffSignalModel>[];

  setUpAll(() => registerFallbackValue(NoParams()));

  setUp(() {
    planning = MockPlanning();
    live = MockLive();
    now = t0;
    signals = [];
    when(() => planning(any())).thenAnswer(
      (_) async => Right(
        PlanningModel(
          date: '2026-10-03',
          parking: const PlanningParkingModel(id: 'p1', name: 'Parking Démo LYS'),
          arrivals: [
            row('r0', 'Louis Leroy', 'LM-789-NP', t0.subtract(const Duration(minutes: 30))),
            row('r2', 'Léa Durand', 'GH-456-JK', t0.add(const Duration(minutes: 50))),
            row('r1', 'Camille Martin', 'AB-123-CD', t0.add(const Duration(minutes: 20))),
          ],
          returns: [row('r3', 'Quentin Roux', 'QR-321-ST', t0, status: 'shuttled_out')],
        ),
      ),
    );
    when(() => live(any())).thenAnswer((_) async => Right(LiveArrivalsModel(serverTime: now, signals: signals)));
  });

  ProTodayBloc build() => ProTodayBloc(planning, live, clock: () => now, autoPoll: false);
  Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 1));

  test('l’arrivée en approche passe en tête, l’annonce reste à sa place', () async {
    signals = [
      staffSignal('r1'),
      staffSignal('r2', id: 's2', state: ArrivalSignalState.announced, etaMinutes: 20, announcedMinutes: 20, withPosition: false),
    ];
    final bloc = build()..add(const ProTodayStarted());
    await settle();
    expect(bloc.state.arrivals.map((r) => r.booking.id), ['r1', 'r0', 'r2']);
    expect(bloc.state.arrivals.first.approaching, isTrue);
    expect(bloc.state.arrivals.last.signal?.announcedMinutes, 20);
    await bloc.close();
  });

  test('un bandeau par nouvel événement, pas de répétition', () async {
    signals = [staffSignal('r1')];
    final bloc = build()..add(const ProTodayStarted());
    await settle();
    expect(bloc.state.banner?.reservationId, 'r1');
    bloc.add(const ProTodayBannerDismissed());
    await settle();
    expect(bloc.state.banner, isNull);

    // Same sharing, polled again: no new banner.
    bloc.add(const ProTodayPolled());
    await settle();
    expect(bloc.state.banner, isNull);

    // The return traveller reaches the meeting point: new event.
    signals = [staffSignal('r1'), staffSignal('r3', id: 's3', kind: ArrivalKind.returnTrip, state: ArrivalSignalState.atMeetingPoint, withPosition: false)];
    bloc.add(const ProTodayPolled());
    await settle();
    expect(bloc.state.banner?.reservationId, 'r3');
    expect(bloc.state.returns.first.atMeetingPoint, isTrue);
    await bloc.close();
  });

  test('ne recharge le planning qu’une fois par minute, les signaux à chaque passage', () async {
    final bloc = build()..add(const ProTodayStarted());
    await settle();
    bloc.add(const ProTodayPolled());
    await settle();
    verify(() => planning(any())).called(1);
    verify(() => live(any())).called(2);
    now = t0.add(const Duration(minutes: 1));
    bloc.add(const ProTodayPolled());
    await settle();
    verify(() => planning(any())).called(1);
    await bloc.close();
  });

  test('l’âge de la position avance entre deux interrogations', () async {
    signals = [staffSignal('r1')];
    final bloc = build()..add(const ProTodayStarted());
    await settle();
    expect(bloc.state.positionAge(signals.first, t0.add(const Duration(seconds: 5))), 25);
    await bloc.close();
  });

  test('navigation entre les dates : la journée choisie est rechargée tout de suite, retour à aujourd’hui', () async {
    final bloc = build()..add(const ProTodayStarted());
    await settle();
    verify(() => planning(null)).called(1);
    bloc.add(const ProTodayDateChanged('2026-10-07'));
    await settle();
    verify(() => planning('2026-10-07')).called(1);
    expect(bloc.state.date, '2026-10-07');
    // The same day again: nothing to load.
    bloc.add(const ProTodayDateChanged('2026-10-07'));
    await settle();
    verifyNever(() => planning('2026-10-07'));
    bloc.add(const ProTodayDateChanged(null));
    await settle();
    expect(bloc.state.date, isNull);
    verify(() => planning(null)).called(1);
    await bloc.close();
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/features/return_day/domain/usecases/return_use_cases.dart';
import 'package:parking_app/src/features/return_day/presentation/bloc/return_bloc.dart';

import '../../helpers/fixtures.dart';

class MockGet extends Mock implements GetReturnUseCase {}

class MockLanded extends Mock implements DeclareLandedUseCase {}

class MockShuttle extends Mock implements GetShuttleStatusUseCase {}

void main() {
  late MockGet get;
  late MockLanded landed;
  late MockShuttle shuttle;
  late DateTime now;

  Either<Failure, T> ok<T>(T value) => Right(value);
  Future<void> settle() => Future<void>.delayed(Duration.zero).then((_) => Future<void>.delayed(Duration.zero));

  setUp(() {
    get = MockGet();
    landed = MockLanded();
    shuttle = MockShuttle();
    now = t0;
    when(() => get(any())).thenAnswer((_) async => ok(travellerReturn()));
  });

  ReturnBloc build() => ReturnBloc(get, landed, shuttle, clock: () => now, autoPoll: false);

  Future<ReturnBloc> opened() async {
    final bloc = build()..add(const ReturnOpened('r7kq2m'));
    await bloc.stream.firstWhere((s) => s.data != null);
    return bloc;
  }

  test('ouvre le bloc : vol prévu → étape « vol »', () async {
    final bloc = await opened();
    expect(bloc.state.reference, 'R7KQ2M');
    expect(bloc.state.step, ReturnStep.flight);
    expect(bloc.state.data?.flight.number, 'TO 3627');
    await bloc.close();
  });

  test('atterri (API) → « Rejoignez le point de rendez-vous » ; au point → « La navette vient vous chercher »', () async {
    when(() => get(any())).thenAnswer((_) async => ok(travellerReturn(flight: landedFlight())));
    final bloc = await opened();
    expect(bloc.state.step, ReturnStep.meetingPoint);
    when(() => get(any())).thenAnswer((_) async => ok(travellerReturn(flight: landedFlight(), atMeetingPointAt: t0)));
    bloc.add(const ReturnRefreshRequested());
    await settle();
    expect(bloc.state.step, ReturnStep.shuttle);
    await bloc.close();
  });

  test('« J’ai atterri » : atterri par le voyageur', () async {
    when(() => landed(any())).thenAnswer((_) async => ok(travellerReturn(flight: landedFlight(number: null, source: 'traveller'))));
    final bloc = await opened();
    bloc.add(const ReturnLandedDeclared());
    await settle();
    verify(() => landed('R7KQ2M')).called(1);
    expect(bloc.state.actionState, ViewState.success);
    expect(bloc.state.data?.flight.landedSource, 'traveller');
    expect(bloc.state.step, ReturnStep.meetingPoint);
    await bloc.close();
  });

  test('sans navette : tout le bloc est relu un tick sur trois (30 s)', () async {
    final bloc = await opened();
    bloc.add(const ReturnTicked());
    bloc.add(const ReturnTicked());
    await settle();
    verify(() => get(any())).called(1); // the opening only
    verifyNever(() => shuttle(any()));
    bloc.add(const ReturnTicked());
    await settle();
    verify(() => get(any())).called(1);
    await bloc.close();
  });

  test('navette en route : la position est demandée à chaque tick (10 s), et le trajet qui se termine est détecté', () async {
    when(() => get(any())).thenAnswer((_) async => ok(travellerReturn(flight: landedFlight(), atMeetingPointAt: t0, shuttle: travellerShuttle())));
    when(() => shuttle(any())).thenAnswer((_) async => ok(ShuttleStatusModel(shuttle: travellerShuttle(etaMinutes: 2), serverTime: now)));
    final bloc = await opened();
    expect(bloc.state.step, ReturnStep.shuttle);
    expect(bloc.state.data?.shuttle?.etaMinutes, 4);

    bloc.add(const ReturnTicked());
    await settle();
    verify(() => shuttle('R7KQ2M')).called(1);
    expect(bloc.state.data?.shuttle?.etaMinutes, 2);
    verify(() => get(any())).called(1); // not the whole block

    // The driver ended the trip: the shuttle disappears, the block is reloaded, a notice is kept.
    when(() => shuttle(any())).thenAnswer((_) async => ok(ShuttleStatusModel(shuttle: null, serverTime: now)));
    when(() => get(any())).thenAnswer((_) async => ok(travellerReturn(flight: landedFlight(), atMeetingPointAt: t0)));
    bloc.add(const ReturnTicked());
    await settle();
    expect(bloc.state.data?.shuttle, isNull);
    expect(bloc.state.shuttleEndedAt, isNotNull);
    verify(() => shuttle(any())).called(1);
    verify(() => get(any())).called(1);

    // Back to the slow rhythm: no shuttle call any more.
    bloc.add(const ReturnTicked());
    await settle();
    verifyNever(() => shuttle(any()));
    await bloc.close();
  });

  test('une erreur réseau à l’ouverture est signalée, une erreur de rafraîchissement n’efface rien', () async {
    when(() => get(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'x')));
    final bloc = build()..add(const ReturnOpened('R7KQ2M'));
    await settle();
    expect(bloc.state.loadState, ViewState.error);
    expect(bloc.state.errorCode, 'network');
    await bloc.close();
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/features/return_day/domain/usecases/return_use_cases.dart';
import 'package:parking_app/src/features/return_day/presentation/bloc/stay_shuttles_bloc.dart';

import '../../helpers/fixtures.dart';

class MockGet extends Mock implements GetStayShuttlesUseCase {}

void main() {
  late MockGet get;

  Either<Failure, T> ok<T>(T value) => Right(value);
  Future<void> settle() => Future<void>.delayed(Duration.zero).then((_) => Future<void>.delayed(Duration.zero));

  StayShuttlesModel stay({String? phase = 'arrival', List<TravellerShuttleModel> shuttles = const []}) => StayShuttlesModel(phase: phase, serverTime: t0, shuttles: shuttles);

  setUp(() => get = MockGet());

  StayShuttlesBloc build() => StayShuttlesBloc(get, clock: () => t0, pollInterval: const Duration(milliseconds: 20));

  test('S-A · le jour d’arrivée : les navettes du parking, la sienne repérée, rafraîchies tant que le bloc est visible', () async {
    final theirs = travellerShuttle().copyWith(tripId: 't2', mine: false, direction: 'dropoff', destination: const ShuttleDestinationModel(kind: 'parking', lat: 45.73, lng: 5.05));
    final mine = travellerShuttle(etaMinutes: 3).copyWith(mine: true, destination: const ShuttleDestinationModel(kind: 'parking', lat: 45.73, lng: 5.05));
    var calls = 0;
    when(() => get(any())).thenAnswer((_) async {
      calls += 1;
      return ok(stay(shuttles: calls == 1 ? [theirs] : [theirs, mine]));
    });
    final bloc = build()..add(const StayShuttlesOpened('r7kq2m'));
    await bloc.stream.firstWhere((s) => s.data != null);
    expect(bloc.state.reference, 'R7KQ2M');
    expect(bloc.state.visible, isTrue);
    expect(bloc.state.data!.mine, isNull);
    // The timer polls: the second answer holds the traveller's own shuttle.
    await bloc.stream.firstWhere((s) => s.data!.shuttles.length == 2);
    expect(bloc.state.data!.mine?.tripId, 't1');
    expect(bloc.state.data!.mine?.etaMinutes, 3);
    await bloc.close();
  });

  test('hors des jours du séjour : phase nulle, bloc caché, pas de nouvel appel', () async {
    when(() => get(any())).thenAnswer((_) async => ok(stay(phase: null)));
    final bloc = build()..add(const StayShuttlesOpened('R7KQ2M'));
    await bloc.stream.firstWhere((s) => s.data != null);
    expect(bloc.state.visible, isFalse);
    await Future<void>.delayed(const Duration(milliseconds: 70));
    verify(() => get(any())).called(1);
    await bloc.close();
  });

  test('erreur réseau à l’ouverture : état d’erreur traduit ; un rafraîchissement raté garde les données', () async {
    when(() => get(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 404, code: 'not_found')));
    final bloc = StayShuttlesBloc(get, clock: () => t0, autoPoll: false)..add(const StayShuttlesOpened('R7KQ2M'));
    await settle();
    expect(bloc.state.loadState, ViewState.error);
    expect(bloc.state.errorCode, 'not_found');
    when(() => get(any())).thenAnswer((_) async => ok(stay(phase: 'return', shuttles: [travellerShuttle().copyWith(mine: true)])));
    bloc.add(const StayShuttlesRefreshRequested());
    await settle();
    expect(bloc.state.data?.phase, 'return');
    when(() => get(any())).thenAnswer((_) async => const Left(ServerFailure(code: 'network')));
    bloc.add(const StayShuttlesRefreshRequested());
    await settle();
    expect(bloc.state.data?.phase, 'return', reason: 'the last good answer stays');
    expect(bloc.state.loadState, ViewState.success);
    await bloc.close();
  });
}

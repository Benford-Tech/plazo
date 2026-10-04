import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_occupation/data/models/occupation_models.dart';
import 'package:parking_app/src/features/pro_occupation/domain/usecases/occupation_use_cases.dart';
import 'package:parking_app/src/features/pro_plan/data/models/plan_models.dart';
import 'package:parking_app/src/features/pro_plan/domain/usecases/plan_use_cases.dart';
import 'package:parking_app/src/features/pro_spot_planning/data/models/spot_planning_models.dart';
import 'package:parking_app/src/features/pro_spot_planning/domain/usecases/spot_planning_use_cases.dart';
import 'package:parking_app/src/features/pro_spot_planning/presentation/bloc/pro_spot_planning_bloc.dart';

class MockGetParking extends Mock implements GetProParkingUseCase {}

class MockGet extends Mock implements GetSpotPlanningUseCase {}

class MockPreassign extends Mock implements PreassignSpotsUseCase {}

class MockAssign extends Mock implements AssignSpotUseCase {}

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 2));

const parking = ParkingSummaryModel(id: 'p1', name: 'Parkair', totalCapacity: 2);
final stayA = PlannedStayModel(
  id: 'r1',
  reference: 'RAAA11',
  customerName: 'Mme Laurent',
  plate: 'AA-111-AA',
  status: 'arrived',
  arrivalAt: DateTime(2026, 10, 4, 6),
  returnAt: DateTime(2026, 10, 7, 18),
  spotId: 's1',
  onSite: true,
);
final stayB = PlannedStayModel(
  id: 'r2',
  reference: 'RBBB22',
  customerName: 'M. Petit',
  plate: 'BB-222-BB',
  status: 'upcoming',
  arrivalAt: DateTime(2026, 10, 5, 6),
  returnAt: DateTime(2026, 10, 8, 18),
);
final planning = SpotPlanningModel(
  from: '2026-10-04',
  days: 7,
  capacity: 2,
  spots: [
    PlannedSpotModel(id: 's1', zoneId: 'z', code: 'A-01-01', row: 1, index: 1, kind: 'standard', active: true, stays: [stayA]),
    const PlannedSpotModel(id: 's2', zoneId: 'z', code: 'A-01-02', row: 1, index: 2, kind: 'standard', active: true, stayClass: 'short'),
  ],
  unplaced: [stayB],
  alerts: const [PlanningAlertModel(kind: 'unplaced', count: 1)],
);

void main() {
  late MockGetParking getParking;
  late MockGet get;
  late MockPreassign preassign;
  late MockAssign assign;

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const SpotPlanningParams(parkingId: '', from: ''));
    registerFallbackValue(const AssignSpotParams(reservationId: '', spotId: null));
  });

  setUp(() {
    getParking = MockGetParking();
    get = MockGet();
    preassign = MockPreassign();
    assign = MockAssign();
    when(() => getParking(any())).thenAnswer((_) async => const Right(parking));
    when(() => get(any())).thenAnswer((_) async => Right(planning));
  });

  ProSpotPlanningBloc bloc() => ProSpotPlanningBloc(getParking, get, preassign, assign, now: DateTime(2026, 10, 4, 12));

  test('charge la fenêtre du jour, la déplace d’une semaine, change sa longueur', () async {
    final b = bloc()..add(const ProSpotPlanningStarted());
    await settle();
    expect(b.state.viewState, ViewState.success);
    verify(() => get(const SpotPlanningParams(parkingId: 'p1', from: '2026-10-04', days: 7))).called(1);
    b.add(const ProSpotPlanningWindowMoved(1));
    await settle();
    verify(() => get(const SpotPlanningParams(parkingId: 'p1', from: '2026-10-11', days: 7))).called(1);
    b.add(const ProSpotPlanningDaysChanged(14));
    await settle();
    verify(() => get(const SpotPlanningParams(parkingId: 'p1', from: '2026-10-11', days: 14))).called(1);
  });

  test('les places libres sur tout le séjour excluent celles prises par un autre séjour qui chevauche', () async {
    final b = bloc()..add(const ProSpotPlanningStarted());
    await settle();
    expect(b.state.freeSpotsFor(stayB).map((s) => s.code), ['A-01-02']);
    expect(b.state.freeSpotsFor(stayA).map((s) => s.code), ['A-01-01', 'A-01-02']);
  });

  test('pré-affecte puis recharge ; déplace un séjour et signale la place', () async {
    when(() => preassign(any())).thenAnswer((_) async => const Right(PreassignResultModel(assigned: [PreassignedModel(reservationId: 'r2', reference: 'RBBB22', spotId: 's2', code: 'A-01-02')])));
    when(() => assign(any())).thenAnswer(
      (_) async => const Right(
        OccupantModel(id: 'r2', reference: 'RBBB22', customerName: 'M. Petit', plate: 'BB-222-BB', status: 'upcoming', arrivalAt: '2026-10-05T06:00', returnAt: '2026-10-08T18:00', spotId: 's2', spot: SpotRefModel(code: 'A-01-02')),
      ),
    );
    final b = bloc()..add(const ProSpotPlanningStarted());
    await settle();
    b.add(const ProSpotPlanningPreassignRequested());
    await settle();
    expect(b.state.notice, 'planning.preassigned:1:0');
    verify(() => get(any())).called(2);
    b.add(ProSpotPlanningMoved(stay: stayB, spotId: 's2'));
    await settle();
    expect(b.state.notice, 'planning.moved:BB-222-BB:A-01-02');
    final params = verify(() => assign(captureAny())).captured.single as AssignSpotParams;
    expect(params.reservationId, 'r2');
    expect(params.spotId, 's2');
  });

  test('une place prise remonte son code', () async {
    when(() => assign(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 409, code: 'spot_taken')));
    final b = bloc()..add(const ProSpotPlanningStarted());
    await settle();
    b.add(ProSpotPlanningMoved(stay: stayB, spotId: 's1'));
    await settle();
    expect(b.state.actionState, ViewState.error);
    expect(b.state.errorCode, 'spot_taken');
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_occupation/data/models/occupation_models.dart';
import 'package:parking_app/src/features/pro_occupation/domain/usecases/occupation_use_cases.dart';
import 'package:parking_app/src/features/pro_occupation/presentation/bloc/pro_occupation_bloc.dart';
import 'package:parking_app/src/features/pro_plan/data/models/plan_models.dart';
import 'package:parking_app/src/features/pro_plan/domain/usecases/plan_use_cases.dart';

class MockGetParking extends Mock implements GetProParkingUseCase {}

class MockGetBoard extends Mock implements GetOccupationUseCase {}

class MockSearch extends Mock implements SearchVehiclesUseCase {}

class MockAssign extends Mock implements AssignSpotUseCase {}

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 2));

const parking = ParkingSummaryModel(id: 'p1', name: 'Parkair', totalCapacity: 2);
final ring = [
  [5.08, 45.72],
  [5.08004, 45.72],
  [5.08004, 45.72004],
  [5.08, 45.72004],
  [5.08, 45.72],
];
const occupant = OccupantModel(
  id: 'r1',
  reference: 'RABC12',
  customerName: 'Mme Laurent',
  plate: 'GK-318-PX',
  status: 'arrived',
  arrivalAt: '2026-10-04T06:30',
  returnAt: '2026-10-11T16:00',
  spotId: 's1',
  keyHook: '17',
  onSite: true,
);
const arrival = OccupantModel(
  id: 'r2',
  reference: 'RDEF34',
  customerName: 'M. Petit',
  plate: 'AB-123-CD',
  status: 'upcoming',
  arrivalAt: '2026-10-04T12:10',
  returnAt: '2026-10-09T08:00',
  suggestions: [SuggestionModel(spotId: 's2', code: 'A-01-02', distanceM: 12, reason: 'near_handover')],
);
final board = OccupationBoardModel(
  date: '2026-10-04',
  spots: [
    SpotStateModel(id: 's1', zoneId: 'z', code: 'A-01-01', row: 1, index: 1, kind: 'standard', active: true, geometry: ring, occupant: occupant),
    SpotStateModel(id: 's2', zoneId: 'z', code: 'A-01-02', row: 1, index: 2, kind: 'standard', active: true, geometry: ring),
    SpotStateModel(id: 's3', zoneId: 'z', code: 'A-01-03', row: 1, index: 3, kind: 'standard', active: true, geometry: ring),
  ],
  arrivals: const [arrival],
  stats: const OccupationStatsModel(active: 3, occupied: 1, leavingToday: 0),
);

void main() {
  late MockGetParking getParking;
  late MockGetBoard getBoard;
  late MockSearch search;
  late MockAssign assign;

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const SearchVehiclesParams(parkingId: '', query: ''));
    registerFallbackValue(const AssignSpotParams(reservationId: '', spotId: null));
  });

  setUp(() {
    getParking = MockGetParking();
    getBoard = MockGetBoard();
    search = MockSearch();
    assign = MockAssign();
    when(() => getParking(any())).thenAnswer((_) async => const Right(parking));
    when(() => getBoard('p1')).thenAnswer((_) async => Right(board));
  });

  ProOccupationBloc bloc() => ProOccupationBloc(getParking, getBoard, search, assign);

  test('charge le tableau ; les places libres sont proposées suggestion en tête', () async {
    final b = bloc()..add(const ProOccupationStarted());
    await settle();
    expect(b.state.viewState, ViewState.success);
    expect(b.state.arrivals.single.plate, 'AB-123-CD');
    expect(b.state.freeSpots(first: arrival.suggestions).map((s) => s.code), ['A-01-02', 'A-01-03']);
  });

  test('ouvert depuis une fiche (C-B) : la carte du véhicule demandé est ouverte', () async {
    final b = bloc()..add(const ProOccupationStarted(focus: 'r2'));
    await settle();
    expect(b.state.vehicle?.id, 'r2');
    final none = bloc()..add(const ProOccupationStarted(focus: 'unknown'));
    await settle();
    expect(none.state.vehicle, isNull);
  });

  test('place une arrivée sur la place proposée, recharge et signale', () async {
    when(() => assign(any())).thenAnswer((_) async => Right(arrival.copyWith(spotId: 's2', spot: const SpotRefModel(code: 'A-01-02'))));
    final b = bloc()..add(const ProOccupationStarted());
    await settle();
    b.add(const ProOccupationPlaced(reservationId: 'r2', spotId: 's2'));
    await settle();
    final params = verify(() => assign(captureAny())).captured.single as AssignSpotParams;
    expect(params.reservationId, 'r2');
    expect(params.spotId, 's2');
    expect(params.keysOnly, isFalse);
    expect(b.state.notice, 'occupation.placed:AB-123-CD:A-01-02');
    verify(() => getBoard('p1')).called(2);
  });

  test('place déjà prise : code d\'erreur remonté', () async {
    when(() => assign(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 409, code: 'spot_taken')));
    final b = bloc()..add(const ProOccupationStarted());
    await settle();
    b.add(const ProOccupationPlaced(reservationId: 'r2', spotId: 's1'));
    await settle();
    expect(b.state.actionState, ViewState.error);
    expect(b.state.errorCode, 'spot_taken');
  });

  test('recherche par plaque puis enregistrement du crochet des clés', () async {
    when(() => search(any())).thenAnswer((_) async => const Right([occupant]));
    when(() => assign(any())).thenAnswer((_) async => Right(occupant.copyWith(keyHook: 'B4')));
    final b = bloc()..add(const ProOccupationStarted());
    await settle();
    b.add(const ProOccupationSearched('gk 318'));
    await settle();
    expect(b.state.results.single.customerName, 'Mme Laurent');
    b.add(const ProOccupationVehicleChosen(occupant));
    b.add(const ProOccupationKeysSaved(reservationId: 'r1', keyHook: 'B4'));
    await settle();
    final params = verify(() => assign(captureAny())).captured.single as AssignSpotParams;
    expect(params.spotId, 's1');
    expect(params.keyHook, 'B4');
    expect(params.keysOnly, isTrue);
    expect(b.state.vehicle?.keyHook, 'B4');
    expect(b.state.notice, 'occupation.keys_saved');
  });
}

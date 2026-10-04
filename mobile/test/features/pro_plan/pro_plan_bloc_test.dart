import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_plan/data/models/plan_models.dart';
import 'package:parking_app/src/features/pro_plan/domain/usecases/plan_use_cases.dart';
import 'package:parking_app/src/features/pro_plan/presentation/bloc/pro_plan_bloc.dart';
import 'package:parking_app/src/services/location_service.dart';

class MockGetParking extends Mock implements GetProParkingUseCase {}

class MockGetPlan extends Mock implements GetPlanUseCase {}

class MockSaveOutline extends Mock implements SaveOutlineUseCase {}

class MockEstimate extends Mock implements EstimatePlanUseCase {}

class MockGenerate extends Mock implements GeneratePlanUseCase {}

class MockGeocode extends Mock implements GeocodeUseCase {}

class MockLocation extends Mock implements LocationService {}

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 2));

const parking = ParkingSummaryModel(id: 'p1', name: 'Parkair', totalCapacity: 150);
const emptyPlan = ParkingPlanViewModel(plan: ParkingPlanModel(id: 'pl', parkingId: 'p1'), activeSpots: 0, totalCapacity: 150);
final spot = SpotModel(id: 's1', code: 'A-01-01', row: 1, index: 1, kind: 'standard', active: true, geometry: [
  [5.08, 45.72],
  [5.08003, 45.72],
  [5.08003, 45.72004],
  [5.08, 45.72004],
  [5.08, 45.72],
]);

void main() {
  late MockGetParking getParking;
  late MockGetPlan getPlan;
  late MockSaveOutline save;
  late MockEstimate estimate;
  late MockGenerate generate;
  late MockGeocode geocode;
  late MockLocation location;

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const SaveOutlineParams(parkingId: '', ring: []));
    registerFallbackValue(const GeneratePlanParams(parkingId: '', layout: ''));
  });

  setUp(() {
    getParking = MockGetParking();
    getPlan = MockGetPlan();
    save = MockSaveOutline();
    estimate = MockEstimate();
    generate = MockGenerate();
    geocode = MockGeocode();
    location = MockLocation();
    when(() => getParking(any())).thenAnswer((_) async => const Right(parking));
  });

  ProPlanBloc bloc() => ProPlanBloc(getParking, getPlan, save, estimate, generate, geocode, location);

  test('sans plan : étape « où », adresse puis position du téléphone', () async {
    when(() => getPlan('p1')).thenAnswer((_) async => const Right(emptyPlan));
    when(() => geocode('Colombier')).thenAnswer((_) async => const Right([GeocodeResultModel(label: 'Colombier-Saugnieu', type: 'municipality', lon: 5.11, lat: 45.71)]));
    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.granted);
    when(() => location.current()).thenAnswer((_) async => GeoPosition(lat: 45.7, lng: 5.0, recordedAt: DateTime(2026)));
    final b = bloc()..add(const ProPlanStarted());
    await settle();
    expect(b.state.step, PlanStep.locate);
    expect(b.state.center, isNull);
    b.add(const ProPlanAddressSearched('Colombier'));
    await settle();
    expect(b.state.results.single.label, 'Colombier-Saugnieu');
    b.add(ProPlanResultChosen(b.state.results.single));
    await settle();
    expect(b.state.center, const LatLng(45.71, 5.11));
    expect(b.state.results, isEmpty);
    b.add(const ProPlanGeolocateRequested());
    await settle();
    expect(b.state.center, const LatLng(45.7, 5.0));
  });

  test('tracé : coins, rectangle auto, validation → estimation, puis génération applique la capacité', () async {
    when(() => getPlan('p1')).thenAnswer((_) async => const Right(emptyPlan));
    when(() => save(any())).thenAnswer((_) async => const Right(emptyPlan));
    when(() => estimate('p1')).thenAnswer((_) async => const Right(PlanEstimateModel(usableArea: 2400, totals: {'selfPark': 72, 'valet24': 112, 'valet5': 118})));
    when(() => generate(any())).thenAnswer(
      (_) async => Right(ParkingPlanViewModel(plan: const ParkingPlanModel(id: 'pl', parkingId: 'p1', layout: 'valet24'), spots: [spot], activeSpots: 1, totalCapacity: 112)),
    );
    final b = bloc()..add(const ProPlanStarted());
    await settle();
    b.add(const ProPlanStepChanged(PlanStep.draw));
    b.add(const ProPlanCornerAdded(LatLng(45.72, 5.08)));
    b.add(const ProPlanCornerAdded(LatLng(45.72, 5.0808)));
    await settle();
    expect(b.state.canValidate, isFalse);
    b.add(const ProPlanCornerAdded(LatLng(45.7204, 5.0808)));
    b.add(const ProPlanCornerAdded(LatLng(45.7204, 5.08)));
    await settle();
    expect(b.state.corners, hasLength(4));
    expect(b.state.areaM2, greaterThan(2000));
    b.add(const ProPlanLastCornerUndone());
    await settle();
    expect(b.state.corners, hasLength(3));
    b.add(const ProPlanRectangleRequested());
    await settle();
    expect(b.state.corners, hasLength(4));
    b.add(const ProPlanOutlineValidated());
    await settle();
    final saved = verify(() => save(captureAny())).captured.single as SaveOutlineParams;
    expect(saved.ring, hasLength(5)); // closed ring
    expect(saved.ring.first, saved.ring.last);
    expect(b.state.step, PlanStep.generate);
    expect(b.state.countFor('valet24'), 112);
    b.add(const ProPlanLayoutChosen('valet5'));
    await settle();
    b.add(const ProPlanGenerateRequested());
    await settle();
    final gen = verify(() => generate(captureAny())).captured.single as GeneratePlanParams;
    expect(gen.layout, 'valet5');
    expect(b.state.generated, isTrue);
    expect(b.state.parking!.totalCapacity, 112);
    expect(b.state.spots, hasLength(1));
  });

  test('un plan déjà tracé rouvre sur ses coins ; une erreur serveur remonte son code', () async {
    final outline = {
      'type': 'Polygon',
      'coordinates': [
        [
          [5.08, 45.72],
          [5.0808, 45.72],
          [5.0808, 45.7204],
          [5.08, 45.72],
        ],
      ],
    };
    when(() => getPlan('p1')).thenAnswer((_) async => Right(ParkingPlanViewModel(plan: ParkingPlanModel(id: 'pl', parkingId: 'p1', outline: outline), activeSpots: 0, totalCapacity: 150)));
    when(() => estimate('p1')).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'no_spots')));
    final b = bloc()..add(const ProPlanStarted());
    await settle();
    expect(b.state.step, PlanStep.draw);
    expect(b.state.corners, hasLength(3));
    expect(b.state.center, isNotNull);
    expect(b.state.errorCode, 'no_spots');
  });
}

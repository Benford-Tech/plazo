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
import 'package:parking_app/src/features/pro_spot_planning/data/models/files_planning_models.dart';
import 'package:parking_app/src/features/pro_spot_planning/data/models/spot_planning_models.dart';
import 'package:parking_app/src/features/pro_spot_planning/domain/usecases/spot_planning_use_cases.dart';
import 'package:parking_app/src/features/pro_spot_planning/presentation/bloc/pro_spot_planning_bloc.dart';

class MockGetParking extends Mock implements GetProParkingUseCase {}

class MockGet extends Mock implements GetSpotPlanningUseCase {}

class MockPreassign extends Mock implements PreassignSpotsUseCase {}

class MockAssign extends Mock implements AssignSpotUseCase {}

class MockGetFilesPlanning extends Mock implements GetFilesPlanningUseCase {}

class MockKeepFile extends Mock implements KeepFileUseCase {}

class MockPrepareFiles extends Mock implements PrepareFilesUseCase {}

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

/// A parking without files: the planning reads its spots.
const noFiles = FilesPlanningModel(from: '2026-10-04', days: 7, timezone: 'Europe/Paris');

/// Planning des files (08/10/2026): two files, one serving the 6th, one kept by hand for the 5th.
const filesPlanning = FilesPlanningModel(
  from: '2026-10-04',
  days: 7,
  timezone: 'Europe/Paris',
  capacity: 6,
  files: [
    FilesPlanningFileModel(id: 'f1', code: 'F01', capacity: 3, active: true, day: '2026-10-06', cars: 2, sound: true),
    FilesPlanningFileModel(id: 'f2', code: 'F02', capacity: 3, active: true, plannedDay: '2026-10-05', day: '2026-10-05', cars: 0, sound: true, keptByHand: true),
  ],
  load: [
    FilesPlanningDayModel(date: '2026-10-04', returns: 0, placed: 0, toCome: 0, onSite: 2, room: 0, missing: 0),
    FilesPlanningDayModel(date: '2026-10-05', returns: 4, placed: 0, toCome: 4, onSite: 6, filesKept: ['F02'], room: 3, missing: 1),
    FilesPlanningDayModel(date: '2026-10-06', returns: 2, placed: 2, toCome: 0, onSite: 2, filesServing: ['F01'], room: 1, missing: 0),
  ],
  alerts: [FilesPlanningAlertModel(kind: 'missing_room', date: '2026-10-05', count: 1)],
);

void main() {
  late MockGetParking getParking;
  late MockGet get;
  late MockPreassign preassign;
  late MockAssign assign;
  late MockGetFilesPlanning getFilesPlanning;
  late MockKeepFile keepFile;
  late MockPrepareFiles prepareFiles;

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const SpotPlanningParams(parkingId: '', from: ''));
    registerFallbackValue(const AssignSpotParams(reservationId: '', spotId: null));
    registerFallbackValue(const KeepFileParams(parkingId: '', fileId: '', day: null));
  });

  setUp(() {
    getParking = MockGetParking();
    get = MockGet();
    preassign = MockPreassign();
    assign = MockAssign();
    getFilesPlanning = MockGetFilesPlanning();
    keepFile = MockKeepFile();
    prepareFiles = MockPrepareFiles();
    when(() => getParking(any())).thenAnswer((_) async => const Right(parking));
    when(() => get(any())).thenAnswer((_) async => Right(planning));
    // No file: the parking reads its spots.
    when(() => getFilesPlanning(any())).thenAnswer((_) async => const Right(noFiles));
  });

  ProSpotPlanningBloc bloc() => ProSpotPlanningBloc(getParking, get, preassign, assign, getFilesPlanning, keepFile, prepareFiles, now: DateTime(2026, 10, 4, 12));

  test('charge la fenêtre du jour, la déplace d’une semaine, change sa longueur', () async {
    final b = bloc()..add(const ProSpotPlanningStarted());
    await settle();
    expect(b.state.viewState, ViewState.success);
    expect(b.state.filesMode, isFalse);
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

  group('Planning des files (08/10/2026)', () {
    setUp(() => when(() => getFilesPlanning(any())).thenAnswer((_) async => const Right(filesPlanning)));

    test('un parking en files charge le planning des files, jamais celui des places ; la fenêtre le recharge', () async {
      final b = bloc()..add(const ProSpotPlanningStarted());
      await settle();
      expect(b.state.viewState, ViewState.success);
      expect(b.state.filesMode, isTrue);
      expect(b.state.loaded, isTrue);
      expect(b.state.planning, isNull);
      expect(b.state.filesPlanning?.capacity, 6);
      expect(b.state.fileByCode('F02')?.keptByHand, isTrue);
      expect(b.state.emptyFiles.map((f) => f.code), ['F02']);
      verify(() => getFilesPlanning(const SpotPlanningParams(parkingId: 'p1', from: '2026-10-04', days: 7))).called(1);
      verifyNever(() => get(any()));
      b.add(const ProSpotPlanningDaysChanged(14));
      await settle();
      verify(() => getFilesPlanning(const SpotPlanningParams(parkingId: 'p1', from: '2026-10-04', days: 14))).called(1);
      verifyNever(() => get(any()));
    });

    test('réserver une file appelle le cas d’usage avec (file, jour) puis recharge ; la libérer passe null', () async {
      when(() => keepFile(any())).thenAnswer((_) async => const Right(KeptFileModel(id: 'f2', code: 'F02', capacity: 3, plannedDay: '2026-10-05', keptByHand: true)));
      final b = bloc()..add(const ProSpotPlanningStarted());
      await settle();
      b.add(const ProSpotPlanningFileKept(fileId: 'f2', day: '2026-10-05'));
      await settle();
      final params = verify(() => keepFile(captureAny())).captured.single as KeepFileParams;
      expect(params.parkingId, 'p1');
      expect(params.fileId, 'f2');
      expect(params.day, '2026-10-05');
      expect(b.state.actionState, ViewState.success);
      expect(b.state.notice, 'planning.kept:F02:2026-10-05');
      verify(() => getFilesPlanning(any())).called(2);

      when(() => keepFile(any())).thenAnswer((_) async => const Right(KeptFileModel(id: 'f2', code: 'F02', capacity: 3)));
      b.add(const ProSpotPlanningFileKept(fileId: 'f2', day: null));
      await settle();
      final freed = verify(() => keepFile(captureAny())).captured.single as KeepFileParams;
      expect(freed.day, isNull);
      expect(b.state.notice, 'planning.freed:F02');
      verify(() => getFilesPlanning(any())).called(1);
    });

    test('une file qui contient des voitures remonte son code', () async {
      when(() => keepFile(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 409, code: 'file_occupied')));
      final b = bloc()..add(const ProSpotPlanningStarted());
      await settle();
      b.add(const ProSpotPlanningFileKept(fileId: 'f1', day: '2026-10-05'));
      await settle();
      expect(b.state.actionState, ViewState.error);
      expect(b.state.errorCode, 'file_occupied');
      verify(() => getFilesPlanning(any())).called(1);
    });

    test('la préparation de la veille se lance à la demande puis recharge', () async {
      when(() => prepareFiles('p1')).thenAnswer((_) async => const Right(FilesPreparedModel(planned: 2, free: 1)));
      final b = bloc()..add(const ProSpotPlanningStarted());
      await settle();
      b.add(const ProSpotPlanningFilesPrepared());
      await settle();
      expect(b.state.notice, 'occupation.prepared:2:1');
      verify(() => getFilesPlanning(any())).called(2);
    });

    test('les files à proposer pour un jour : les vides, sauf celle déjà gardée à la main pour ce jour', () {
      const planning = FilesPlanningModel(
        from: '2026-10-04',
        days: 7,
        timezone: 'Europe/Paris',
        capacity: 12,
        files: [
          FilesPlanningFileModel(id: 'f1', code: 'F01', capacity: 3, active: true, day: '2026-10-06', cars: 2, sound: true),
          FilesPlanningFileModel(id: 'f2', code: 'F02', capacity: 3, active: true, plannedDay: '2026-10-05', day: '2026-10-05', cars: 0, sound: true, keptByHand: true),
          // Kept by the preparation: still offered on the 5th, to lock it by hand.
          FilesPlanningFileModel(id: 'f3', code: 'F03', capacity: 3, active: true, plannedDay: '2026-10-05', day: '2026-10-05', cars: 0, sound: true),
          FilesPlanningFileModel(id: 'f4', code: 'F04', capacity: 3, active: false, cars: 0, sound: true),
        ],
      );
      const s = ProSpotPlanningState(from: '2026-10-04', filesPlanning: planning);
      expect(s.emptyFiles.map((f) => f.code), ['F02', 'F03']);
      expect(s.keepableFilesFor('2026-10-05').map((f) => f.code), ['F03']);
      // Kept by hand for another day: it can move.
      expect(s.keepableFilesFor('2026-10-06').map((f) => f.code), ['F02', 'F03']);
      expect(const ProSpotPlanningState(from: '2026-10-04').keepableFilesFor('2026-10-05'), isEmpty);
    });

    test('le planning des files se lit tel que le serveur l’envoie', () {
      final m = FilesPlanningModel.fromJson({
        'from': '2026-10-04',
        'days': 2,
        'timezone': 'Europe/Paris',
        'capacity': 3,
        'files': [
          {'id': 'f1', 'code': 'F01', 'name': null, 'capacity': 3, 'active': true, 'plannedDay': '2026-10-05', 'keptByHand': true, 'day': '2026-10-05', 'cars': 0, 'sound': true},
        ],
        'load': [
          {'date': '2026-10-04', 'returns': 0, 'placed': 0, 'toCome': 0, 'onSite': 0, 'filesServing': [], 'filesKept': [], 'room': 0, 'missing': 0},
          {'date': '2026-10-05', 'returns': 4, 'placed': 0, 'toCome': 4, 'onSite': 4, 'filesServing': [], 'filesKept': ['F01'], 'room': 3, 'missing': 1},
        ],
        'alerts': [
          {'kind': 'missing_room', 'date': '2026-10-05', 'count': 1},
          {'kind': 'unsound', 'fileCode': 'F01', 'count': 2},
        ],
      });
      expect(m.files.single.keptByHand, isTrue);
      expect(m.load[1].filesKept, ['F01']);
      expect(m.load[1].missing, 1);
      expect(m.alerts[1].fileCode, 'F01');
      final kept = KeptFileResponse.fromJson({
        'message': 'ok',
        'data': {'id': 'f1', 'parkingId': 'p1', 'code': 'F01', 'name': null, 'capacity': 3, 'geometry': null, 'sortOrder': 0, 'active': true, 'plannedDay': null, 'plannedAt': null, 'keptByHand': false},
      });
      expect(kept.data.plannedDay, isNull);
      expect(kept.data.code, 'F01');
    });
  });
}

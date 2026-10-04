import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_settings/data/models/settings_models.dart';
import 'package:parking_app/src/features/pro_settings/domain/usecases/settings_use_cases.dart';
import 'package:parking_app/src/features/pro_shuttle/data/datasources/shuttle_data_source.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/domain/usecases/shuttle_use_cases.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/pro_vehicles_bloc.dart';

class MockVehicles extends Mock implements GetVehiclesUseCase {}

class MockTeam extends Mock implements GetTeamUseCase {}

class MockSave extends Mock implements SaveVehicleUseCase {}

class MockRemove extends Mock implements RemoveVehicleUseCase {}

void main() {
  late MockVehicles vehicles;
  late MockTeam team;
  late MockSave save;
  late MockRemove remove;

  const vito = ShuttleVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK', seats: 8, driverId: 's1', driverName: 'Karim Benali');
  Future<void> settle() => Future<void>.delayed(Duration.zero).then((_) => Future<void>.delayed(Duration.zero));

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const VehicleSheetParams(input: VehicleSheetInput()));
  });

  setUp(() {
    vehicles = MockVehicles();
    team = MockTeam();
    save = MockSave();
    remove = MockRemove();
    when(() => vehicles(any())).thenAnswer((_) async => const Right([vito]));
    when(() => team(any())).thenAnswer(
      (_) async => const Right([
        TeamMemberModel(id: 's1', email: 'k@example.com', name: 'Karim Benali', role: 'driver'),
        TeamMemberModel(id: 's2', email: 'old@example.com', name: 'Ancien Chauffeur', role: 'driver', isActive: false),
      ]),
    );
  });

  ProVehiclesBloc build() => ProVehiclesBloc(vehicles, team, save, remove);

  test('charge les fiches et l’équipe active (pour le chauffeur habituel)', () async {
    final bloc = build()..add(const ProVehiclesStarted());
    await bloc.stream.firstWhere((s) => s.viewState.isSuccess);
    expect(bloc.state.vehicles, [vito]);
    expect(bloc.state.team.map((m) => m.id), ['s1']);
    await bloc.close();
  });

  test('ajoute, modifie (hors service en un geste) et retire ; l’erreur de champ est gardée', () async {
    when(() => save(any())).thenAnswer((invocation) async {
      final p = invocation.positionalArguments.single as VehicleSheetParams;
      if (p.id == null) return Right(ShuttleVehicleModel(id: 'v2', model: p.input.model!, seats: p.input.seats, inService: true));
      final json = p.input.toJson();
      return Right(vito.copyWith(inService: json['inService'] as bool? ?? vito.inService, seats: json.containsKey('seats') ? json['seats'] as int? : vito.seats));
    });
    when(() => remove(any())).thenAnswer((_) async => const Right(null));
    final bloc = build()..add(const ProVehiclesStarted());
    await bloc.stream.firstWhere((s) => s.viewState.isSuccess);

    bloc.add(const ProVehicleSaved(VehicleSheetParams(input: VehicleSheetInput(model: 'Renault Trafic', seats: 6, inService: true))));
    await settle();
    expect(bloc.state.notice, 'vehicles.added');
    expect(bloc.state.vehicles.map((v) => v.id), ['v1', 'v2']);
    final sent = verify(() => save(captureAny())).captured.single as VehicleSheetParams;
    expect(sent.input.toJson(), {'model': 'Renault Trafic', 'seats': 6, 'inService': true});

    bloc.add(const ProVehicleServiceToggled('v1'));
    await settle();
    await settle();
    expect(bloc.state.vehicles.first.inService, isFalse);
    expect(bloc.state.notice, 'vehicles.updated');

    // Clearing the seats sends an explicit null.
    bloc.add(const ProVehicleSaved(VehicleSheetParams(id: 'v1', input: VehicleSheetInput(model: 'Mercedes Vito', clearSeats: true))));
    await settle();
    expect(bloc.state.vehicles.first.seats, isNull);

    when(() => save(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 422, code: 'invalid_driver', fields: {'driverId': 'invalid_driver'})));
    bloc.add(const ProVehicleSaved(VehicleSheetParams(id: 'v1', input: VehicleSheetInput(driverId: 'nope'))));
    await settle();
    expect(bloc.state.actionState, ViewState.error);
    expect(bloc.state.fieldErrors, {'driverId': 'invalid_driver'});

    bloc.add(const ProVehicleRemoved('v2'));
    await settle();
    expect(bloc.state.vehicles.map((v) => v.id), ['v1']);
    expect(bloc.state.notice, 'vehicles.removed');
    await bloc.close();
  });
}

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/use_case.dart';
import '../../../pro_settings/data/models/settings_models.dart';
import '../../../pro_settings/domain/usecases/settings_use_cases.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../../domain/usecases/shuttle_use_cases.dart';

part 'pro_vehicles_bloc.freezed.dart';

sealed class ProVehiclesEvent {
  const ProVehiclesEvent();
}

class ProVehiclesStarted extends ProVehiclesEvent {
  const ProVehiclesStarted();
}

/// Adds (no id) or edits a vehicle's sheet.
class ProVehicleSaved extends ProVehiclesEvent {
  const ProVehicleSaved(this.params);
  final VehicleSheetParams params;
}

/// "En service" / "Hors service" in one tap.
class ProVehicleServiceToggled extends ProVehiclesEvent {
  const ProVehicleServiceToggled(this.id);
  final String id;
}

class ProVehicleRemoved extends ProVehiclesEvent {
  const ProVehicleRemoved(this.id);
  final String id;
}

class ProVehiclesNoticeShown extends ProVehiclesEvent {
  const ProVehiclesNoticeShown();
}

@freezed
abstract class ProVehiclesState with _$ProVehiclesState {
  const factory ProVehiclesState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    @Default([]) List<ShuttleVehicleModel> vehicles,

    /// The team, to pick a usual driver (active members only).
    @Default([]) List<TeamMemberModel> team,

    /// "vehicles.added", "vehicles.updated", "vehicles.removed".
    String? notice,
    String? errorCode,
    @Default({}) Map<String, String> fieldErrors,
  }) = _ProVehiclesState;
}

/// The vehicle sheets (V-A, 04/10/2026), for managers: model, colour, plate, seats, in service, usual driver.
class ProVehiclesBloc extends Bloc<ProVehiclesEvent, ProVehiclesState> {
  ProVehiclesBloc(this._vehicles, this._team, this._save, this._remove) : super(const ProVehiclesState()) {
    on<ProVehiclesStarted>(_onStarted);
    on<ProVehicleSaved>(_onSaved);
    on<ProVehicleServiceToggled>(_onToggled);
    on<ProVehicleRemoved>(_onRemoved);
    on<ProVehiclesNoticeShown>((e, emit) => emit(state.copyWith(notice: null, errorCode: null, actionState: ViewState.idle)));
  }

  final GetVehiclesUseCase _vehicles;
  final GetTeamUseCase _team;
  final SaveVehicleUseCase _save;
  final RemoveVehicleUseCase _remove;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProVehiclesStarted event, Emitter<ProVehiclesState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final vehicles = await _vehicles(NoParams());
    // The team is a convenience for the driver picker: its failure does not block the sheet.
    final team = await _team(NoParams());
    vehicles.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (list) => emit(state.copyWith(viewState: ViewState.success, vehicles: list, team: team.fold((_) => const [], (t) => t.where((m) => m.isActive).toList()))),
    );
  }

  Future<void> _onSaved(ProVehicleSaved event, Emitter<ProVehiclesState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final result = await _save(event.params);
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f), fieldErrors: f.fields ?? const {})),
      (vehicle) {
        final exists = state.vehicles.any((v) => v.id == vehicle.id);
        emit(
          state.copyWith(
            actionState: ViewState.success,
            vehicles: exists ? [for (final v in state.vehicles) v.id == vehicle.id ? vehicle : v] : [...state.vehicles, vehicle],
            notice: exists ? 'vehicles.updated' : 'vehicles.added',
          ),
        );
      },
    );
  }

  Future<void> _onToggled(ProVehicleServiceToggled event, Emitter<ProVehiclesState> emit) async {
    final current = state.vehicles.where((v) => v.id == event.id).firstOrNull;
    if (current == null) return;
    add(ProVehicleSaved(VehicleSheetParams(id: current.id, input: VehicleSheetInput(inService: !current.inService))));
  }

  Future<void> _onRemoved(ProVehicleRemoved event, Emitter<ProVehiclesState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final result = await _remove(event.id);
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (_) => emit(state.copyWith(actionState: ViewState.success, vehicles: state.vehicles.where((v) => v.id != event.id).toList(), notice: 'vehicles.removed')),
    );
  }
}

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/use_case.dart';
import '../../../pro_plan/data/models/plan_models.dart';
import '../../../pro_plan/domain/usecases/plan_use_cases.dart';
import '../../data/models/occupation_models.dart';
import '../../domain/usecases/occupation_use_cases.dart';

part 'pro_occupation_bloc.freezed.dart';
part 'pro_occupation_event.dart';
part 'pro_occupation_state.dart';

/// Bloc 2, step "Occupation" in the app: find a vehicle, place an arrival, note the key hook.
class ProOccupationBloc extends Bloc<ProOccupationEvent, ProOccupationState> {
  ProOccupationBloc(this._getParking, this._getBoard, this._search, this._assign) : super(const ProOccupationState()) {
    on<ProOccupationStarted>(_onStarted);
    on<ProOccupationRefreshed>((e, emit) => _load(emit));
    on<ProOccupationSearched>(_onSearched);
    on<ProOccupationVehicleChosen>((e, emit) => emit(state.copyWith(vehicle: e.vehicle, notice: null)));
    on<ProOccupationPlaced>(_onPlaced);
    on<ProOccupationKeysSaved>(_onKeys);
    on<ProOccupationErrorDismissed>((e, emit) => emit(state.copyWith(errorCode: null, notice: null, actionState: ViewState.idle)));
  }

  final GetProParkingUseCase _getParking;
  final GetOccupationUseCase _getBoard;
  final SearchVehiclesUseCase _search;
  final AssignSpotUseCase _assign;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProOccupationStarted event, Emitter<ProOccupationState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final parking = await _getParking(NoParams());
    await parking.fold((f) async => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))), (p) async {
      emit(state.copyWith(parking: p));
      await _load(emit);
    });
  }

  Future<void> _load(Emitter<ProOccupationState> emit) async {
    final parking = state.parking;
    if (parking == null) return;
    final result = await _getBoard(parking.id);
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (board) => emit(state.copyWith(viewState: ViewState.success, board: board)),
    );
  }

  Future<void> _onSearched(ProOccupationSearched event, Emitter<ProOccupationState> emit) async {
    final parking = state.parking;
    final q = event.query.trim();
    emit(state.copyWith(query: event.query, vehicle: null));
    if (parking == null || q.length < 2) return emit(state.copyWith(results: const [], searching: false));
    emit(state.copyWith(searching: true));
    final result = await _search(SearchVehiclesParams(parkingId: parking.id, query: q));
    if (state.query.trim() != q) return; // a newer query is running
    result.fold(
      (f) => emit(state.copyWith(searching: false, results: const [], errorCode: _code(f))),
      (list) => emit(state.copyWith(searching: false, results: list)),
    );
  }

  Future<void> _onPlaced(ProOccupationPlaced event, Emitter<ProOccupationState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, notice: null));
    final result = await _assign(AssignSpotParams(reservationId: event.reservationId, spotId: event.spotId, keyHook: event.keyHook));
    await result.fold((f) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))), (updated) async {
      final code = updated.spot?.code;
      emit(
        state.copyWith(
          actionState: ViewState.success,
          vehicle: state.vehicle?.id == updated.id ? updated : state.vehicle,
          results: state.results.map((r) => r.id == updated.id ? updated : r).toList(),
          notice: code == null ? 'occupation.released:${updated.plate}' : 'occupation.placed:${updated.plate}:$code',
        ),
      );
      await _load(emit);
    });
  }

  Future<void> _onKeys(ProOccupationKeysSaved event, Emitter<ProOccupationState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final current = state.vehicle;
    final result = await _assign(AssignSpotParams(reservationId: event.reservationId, spotId: current?.spotId, keyHook: event.keyHook, keysOnly: true));
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (updated) => emit(
        state.copyWith(actionState: ViewState.success, vehicle: state.vehicle?.id == updated.id ? updated : state.vehicle, notice: 'occupation.keys_saved'),
      ),
    );
  }
}

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../../pro_plan/data/models/plan_models.dart';
import '../../../pro_plan/domain/usecases/plan_use_cases.dart';
import '../../data/models/occupation_models.dart';
import '../../domain/usecases/occupation_use_cases.dart';

part 'pro_occupation_bloc.freezed.dart';
part 'pro_occupation_event.dart';
part 'pro_occupation_state.dart';

/// Bloc 2, step "Occupation" in the app: find a vehicle, place an arrival, note the key hook.
class ProOccupationBloc extends Bloc<ProOccupationEvent, ProOccupationState> {
  ProOccupationBloc(this._getParking, this._getBoard, this._search, this._assign, this._getFiles, this._assignFile, this._prepareFiles, {this._location})
    : super(const ProOccupationState()) {
    on<ProOccupationStarted>(_onStarted);
    on<ProOccupationRefreshed>((e, emit) => _load(emit));
    on<ProOccupationSearched>(_onSearched);
    on<ProOccupationVehicleChosen>((e, emit) => emit(state.copyWith(vehicle: e.vehicle, notice: null)));
    on<ProOccupationPlaced>(_onPlaced);
    on<ProOccupationFiled>(_onFiled);
    on<ProOccupationFilesPrepared>(_onPrepared);
    on<ProOccupationKeysSaved>(_onKeys);
    on<ProOccupationErrorDismissed>((e, emit) => emit(state.copyWith(errorCode: null, notice: null, actionState: ViewState.idle)));
  }

  final GetProParkingUseCase _getParking;
  final GetOccupationUseCase _getBoard;
  final SearchVehiclesUseCase _search;
  final AssignSpotUseCase _assign;
  final GetFilesUseCase _getFiles;
  final AssignFileUseCase _assignFile;
  final PrepareFilesUseCase _prepareFiles;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProOccupationStarted event, Emitter<ProOccupationState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final parking = await _getParking(NoParams());
    await parking.fold((f) async => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))), (p) async {
      emit(state.copyWith(parking: p));
      await _load(emit);
      final focus = event.focus;
      if (focus == null) return;
      // The vehicle asked for: among today's arrivals, else on its spot or in its file.
      final found =
          state.arrivals.where((a) => a.id == focus).firstOrNull ??
          state.spots.map((s) => s.occupant).whereType<OccupantModel>().where((o) => o.id == focus).firstOrNull ??
          state.files.expand((f) => f.cars).where((c) => c.id == focus).firstOrNull;
      if (found != null) emit(state.copyWith(vehicle: found));
    });
  }

  /// S-C (07/10/2026): the files first; a parking without files reads its spots as before.
  Future<void> _load(Emitter<ProOccupationState> emit) async {
    final parking = state.parking;
    if (parking == null) return;
    final files = await _getFiles(parking.id);
    final filed = files.fold((f) => null, (board) => board);
    if (filed != null && filed.files.isNotEmpty) return emit(state.copyWith(viewState: ViewState.success, fileBoard: filed));
    final result = await _getBoard(parking.id);
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (board) => emit(state.copyWith(viewState: ViewState.success, board: board, fileBoard: filed)),
    );
  }

  Future<void> _onFiled(ProOccupationFiled event, Emitter<ProOccupationState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, notice: null));
    final car = event.fileId == null ? null : await _fix();
    final result = await _assignFile(AssignFileParams(reservationId: event.reservationId, fileId: event.fileId, keyHook: event.keyHook, car: car));
    await result.fold((f) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))), (updated) async {
      final code = updated.file?.code;
      emit(
        state.copyWith(
          actionState: ViewState.success,
          vehicle: state.vehicle?.id == updated.id ? updated : state.vehicle,
          results: state.results.map((r) => r.id == updated.id ? updated : r).toList(),
          notice: code == null ? 'occupation.released:${updated.plate}' : 'occupation.filed:${updated.plate}:$code',
        ),
      );
      await _load(emit);
    });
  }

  Future<void> _onPrepared(ProOccupationFilesPrepared event, Emitter<ProOccupationState> emit) async {
    final parking = state.parking;
    if (parking == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, notice: null));
    final result = await _prepareFiles(parking.id);
    await result.fold((f) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))), (r) async {
      emit(state.copyWith(actionState: ViewState.success, notice: 'occupation.prepared:${r.planned}:${r.free}'));
      await _load(emit);
    });
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

  final LocationService? _location;

  /// The valet's own position as the car is placed (06/10/2026): one quick fix, when allowed; a
  /// refused permission or no signal just places the car without it.
  Future<GeoPosition?> _fix() async {
    final location = _location;
    if (location == null) return null;
    try {
      if (await location.requestAccess() != LocationAccess.granted) return null;
      return await location.current().timeout(const Duration(seconds: 8), onTimeout: () => null);
    } catch (_) {
      return null;
    }
  }

  Future<void> _onPlaced(ProOccupationPlaced event, Emitter<ProOccupationState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, notice: null));
    final car = event.spotId == null ? null : await _fix();
    final result = await _assign(AssignSpotParams(reservationId: event.reservationId, spotId: event.spotId, keyHook: event.keyHook, car: car));
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
    // In files mode the keys ride the file assignment (the file stays as it is).
    final result = state.filesMode
        ? await _assignFile(AssignFileParams(reservationId: event.reservationId, fileId: current?.file?.id, keyHook: event.keyHook, keysOnly: true))
        : await _assign(AssignSpotParams(reservationId: event.reservationId, spotId: current?.spotId, keyHook: event.keyHook, keysOnly: true));
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (updated) => emit(
        state.copyWith(actionState: ViewState.success, vehicle: state.vehicle?.id == updated.id ? updated : state.vehicle, notice: 'occupation.keys_saved'),
      ),
    );
  }
}

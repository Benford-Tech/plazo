import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:intl/intl.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/use_case.dart';
import '../../../pro_occupation/domain/usecases/occupation_use_cases.dart';
import '../../../pro_plan/data/models/plan_models.dart';
import '../../../pro_plan/domain/usecases/plan_use_cases.dart';
import '../../data/models/spot_planning_models.dart';
import '../../domain/usecases/spot_planning_use_cases.dart';

part 'pro_spot_planning_bloc.freezed.dart';

sealed class ProSpotPlanningEvent {
  const ProSpotPlanningEvent();
}

class ProSpotPlanningStarted extends ProSpotPlanningEvent {
  const ProSpotPlanningStarted();
}

class ProSpotPlanningRefreshed extends ProSpotPlanningEvent {
  const ProSpotPlanningRefreshed();
}

/// Moves the window by [weeks] (0: back to today).
class ProSpotPlanningWindowMoved extends ProSpotPlanningEvent {
  const ProSpotPlanningWindowMoved(this.weeks);
  final int weeks;
}

class ProSpotPlanningDaysChanged extends ProSpotPlanningEvent {
  const ProSpotPlanningDaysChanged(this.days);
  final int days;
}

class ProSpotPlanningPreassignRequested extends ProSpotPlanningEvent {
  const ProSpotPlanningPreassignRequested();
}

/// Puts the stay on [spotId] (null: releases it).
class ProSpotPlanningMoved extends ProSpotPlanningEvent {
  const ProSpotPlanningMoved({required this.stay, required this.spotId});
  final PlannedStayModel stay;
  final String? spotId;
}

class ProSpotPlanningNoticeShown extends ProSpotPlanningEvent {
  const ProSpotPlanningNoticeShown();
}

@freezed
abstract class ProSpotPlanningState with _$ProSpotPlanningState {
  const ProSpotPlanningState._();

  const factory ProSpotPlanningState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    ParkingSummaryModel? parking,
    required String from,
    @Default(7) int days,
    SpotPlanningModel? planning,

    /// "planning.preassigned:3:1", "planning.moved:AB-123-CD:A-01-02", "planning.released:AB-123-CD".
    String? notice,
    String? errorCode,
  }) = _ProSpotPlanningState;

  /// Active, non-reserved spots free over the whole stay (the stay itself excluded).
  List<PlannedSpotModel> freeSpotsFor(PlannedStayModel stay) {
    final spots = planning?.spots ?? const [];
    return spots
        .where(
          (s) =>
              s.active &&
              s.kind != 'reserved' &&
              !s.stays.any((o) => o.id != stay.id && o.arrivalAt.isBefore(stay.returnAt) && o.returnAt.isAfter(stay.arrivalAt)),
        )
        .toList();
  }
}

/// App pro, step 3 (04/10/2026): one line per spot over the coming days, the bookings without a
/// spot, the days short of spots, pre-assignment, and moves.
class ProSpotPlanningBloc extends Bloc<ProSpotPlanningEvent, ProSpotPlanningState> {
  ProSpotPlanningBloc(this._getParking, this._get, this._preassign, this._assign, {DateTime? now})
    : super(ProSpotPlanningState(from: _day(now ?? DateTime.now()))) {
    on<ProSpotPlanningStarted>(_onStarted);
    on<ProSpotPlanningRefreshed>((e, emit) => _load(emit));
    on<ProSpotPlanningWindowMoved>(_onMoved);
    on<ProSpotPlanningDaysChanged>((e, emit) async {
      emit(state.copyWith(days: e.days));
      await _load(emit);
    });
    on<ProSpotPlanningPreassignRequested>(_onPreassign);
    on<ProSpotPlanningMoved>(_onMove);
    on<ProSpotPlanningNoticeShown>((e, emit) => emit(state.copyWith(notice: null, errorCode: null, actionState: ViewState.idle)));
  }

  final GetProParkingUseCase _getParking;
  final GetSpotPlanningUseCase _get;
  final PreassignSpotsUseCase _preassign;
  final AssignSpotUseCase _assign;

  static String _day(DateTime d) => DateFormat('yyyy-MM-dd').format(d);
  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  SpotPlanningParams get _params => SpotPlanningParams(parkingId: state.parking!.id, from: state.from, days: state.days);

  Future<void> _onStarted(ProSpotPlanningStarted event, Emitter<ProSpotPlanningState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final parking = await _getParking(NoParams());
    await parking.fold((f) async => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))), (p) async {
      emit(state.copyWith(parking: p));
      await _load(emit);
    });
  }

  Future<void> _load(Emitter<ProSpotPlanningState> emit) async {
    if (state.parking == null) return;
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final params = _params;
    final result = await _get(params);
    if (params != _params) return; // the window moved meanwhile
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (p) => emit(state.copyWith(viewState: ViewState.success, planning: p)),
    );
  }

  Future<void> _onMoved(ProSpotPlanningWindowMoved event, Emitter<ProSpotPlanningState> emit) async {
    final from = event.weeks == 0 ? _day(DateTime.now()) : _day(DateTime.parse(state.from).add(Duration(days: 7 * event.weeks)));
    emit(state.copyWith(from: from));
    await _load(emit);
  }

  Future<void> _onPreassign(ProSpotPlanningPreassignRequested event, Emitter<ProSpotPlanningState> emit) async {
    if (state.parking == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, notice: null));
    final result = await _preassign(_params);
    await result.fold((f) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))), (r) async {
      emit(state.copyWith(actionState: ViewState.success, notice: 'planning.preassigned:${r.assigned.length}:${r.skipped.length}'));
      await _load(emit);
    });
  }

  Future<void> _onMove(ProSpotPlanningMoved event, Emitter<ProSpotPlanningState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, notice: null));
    final result = await _assign(AssignSpotParams(reservationId: event.stay.id, spotId: event.spotId));
    await result.fold((f) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))), (updated) async {
      final code = updated.spot?.code;
      emit(
        state.copyWith(actionState: ViewState.success, notice: code == null ? 'planning.released:${updated.plate}' : 'planning.moved:${updated.plate}:$code'),
      );
      await _load(emit);
    });
  }
}

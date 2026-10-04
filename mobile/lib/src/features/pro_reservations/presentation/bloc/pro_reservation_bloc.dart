import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../data/models/reservation_models.dart';
import '../../domain/usecases/reservations_use_cases.dart';

part 'pro_reservation_bloc.freezed.dart';

sealed class ProReservationEvent {
  const ProReservationEvent();
}

class ProReservationStarted extends ProReservationEvent {
  const ProReservationStarted(this.id);
  final String id;
}

class ProReservationStatusChanged extends ProReservationEvent {
  const ProReservationStatusChanged(this.status);
  final String status;
}

class ProReservationReplaced extends ProReservationEvent {
  const ProReservationReplaced(this.reservation);
  final ReservationModel reservation;
}

class ProReservationErrorDismissed extends ProReservationEvent {
  const ProReservationErrorDismissed();
}

@freezed
abstract class ProReservationState with _$ProReservationState {
  const factory ProReservationState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    ReservationModel? reservation,
    String? errorCode,

    /// The status just applied, to confirm it.
    String? notice,
  }) = _ProReservationState;
}

/// Allowed status changes (backend/src/domain/reservation.ts), in the order the buttons show.
const Map<String, List<String>> statusTransitions = {
  'pending_payment': [],
  'upcoming': ['arrived', 'cancelled', 'no_show'],
  'arrived': ['shuttled_out', 'return_requested', 'returned', 'upcoming'],
  'shuttled_out': ['return_requested', 'returned', 'arrived'],
  'return_requested': ['returned', 'shuttled_out'],
  'returned': ['return_requested'],
  'cancelled': ['upcoming'],
  'no_show': ['upcoming'],
};

/// One booking: its sheet and its status changes.
class ProReservationBloc extends Bloc<ProReservationEvent, ProReservationState> {
  ProReservationBloc(this._get, this._changeStatus) : super(const ProReservationState()) {
    on<ProReservationStarted>(_onStarted);
    on<ProReservationStatusChanged>(_onStatus);
    on<ProReservationReplaced>((e, emit) => emit(state.copyWith(reservation: e.reservation)));
    on<ProReservationErrorDismissed>((e, emit) => emit(state.copyWith(errorCode: null, notice: null, actionState: ViewState.idle)));
  }

  final GetReservationUseCase _get;
  final ChangeReservationStatusUseCase _changeStatus;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProReservationStarted event, Emitter<ProReservationState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final result = await _get(event.id);
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (r) => emit(state.copyWith(viewState: ViewState.success, reservation: r)),
    );
  }

  Future<void> _onStatus(ProReservationStatusChanged event, Emitter<ProReservationState> emit) async {
    final current = state.reservation;
    if (current == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, notice: null));
    final result = await _changeStatus(ChangeStatusParams(id: current.id, status: event.status));
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (r) => emit(state.copyWith(actionState: ViewState.success, reservation: r, notice: r.status)),
    );
  }
}

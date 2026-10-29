import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/error/failure.dart';
import '../../data/models/extras_models.dart';
import '../../domain/usecases/extras_use_cases.dart';

part 'staff_extras_bloc.freezed.dart';

sealed class StaffExtrasEvent {
  const StaffExtrasEvent();
}

class StaffExtrasStarted extends StaffExtrasEvent {
  const StaffExtrasStarted(this.reservationId);
  final String reservationId;
}

class StaffExtraAccepted extends StaffExtrasEvent {
  const StaffExtraAccepted(this.extraId);
  final String extraId;
}

class StaffExtraDone extends StaffExtrasEvent {
  const StaffExtraDone(this.extraId);
  final String extraId;
}

class StaffExtraRefused extends StaffExtrasEvent {
  const StaffExtraRefused(this.extraId, {this.reason});
  final String extraId;
  final String? reason;
}

class StaffExtrasNoticeShown extends StaffExtrasEvent {
  const StaffExtrasNoticeShown();
}

@freezed
abstract class StaffExtrasState with _$StaffExtrasState {
  const StaffExtrasState._();

  const factory StaffExtrasState({
    String? reservationId,
    StaffExtrasModel? data,
    String? busyId,

    /// accepted | done | refused, or an API code in [errorCode].
    String? notice,
    String? errorCode,
  }) = _StaffExtrasState;

  bool get busy => busyId != null;
}

/// « Services commandés » on a booking's sheet in Plazo Pro (21/10/2026): « Fait » tells the traveller, « Pas possible »
/// refunds them.
class StaffExtrasBloc extends Bloc<StaffExtrasEvent, StaffExtrasState> {
  StaffExtrasBloc(this._extras) : super(const StaffExtrasState()) {
    on<StaffExtrasStarted>(_onStarted);
    on<StaffExtraAccepted>((e, emit) => _act(emit, e.extraId, 'accepted', (id) => _extras.accept(id, e.extraId)));
    on<StaffExtraDone>((e, emit) => _act(emit, e.extraId, 'done', (id) => _extras.done(id, e.extraId)));
    on<StaffExtraRefused>((e, emit) => _act(emit, e.extraId, 'refused', (id) => _extras.refuse(id, e.extraId, e.reason)));
    on<StaffExtrasNoticeShown>((e, emit) => emit(state.copyWith(notice: null, errorCode: null)));
  }

  final StaffExtrasUseCases _extras;

  Future<void> _onStarted(StaffExtrasStarted event, Emitter<StaffExtrasState> emit) async {
    emit(state.copyWith(reservationId: event.reservationId));
    final result = await _extras.load(event.reservationId);
    result.fold((_) {}, (data) => emit(state.copyWith(data: data)));
  }

  Future<void> _act(Emitter<StaffExtrasState> emit, String extraId, String notice, Future<dynamic> Function(String reservationId) call) async {
    final id = state.reservationId;
    if (id == null || state.busy) return;
    emit(state.copyWith(busyId: extraId, notice: null, errorCode: null));
    final result = await call(id);
    result.fold(
      (Failure f) => emit(state.copyWith(busyId: null, errorCode: f.code ?? 'generic')),
      (StaffExtrasModel data) => emit(state.copyWith(data: data, busyId: null, notice: notice)),
    );
  }
}

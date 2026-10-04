// ignore_for_file: prefer_initializing_formals
import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/clock.dart';
import '../../data/models/return_model.dart';
import '../../domain/usecases/return_use_cases.dart';

part 'stay_shuttles_bloc.freezed.dart';

sealed class StayShuttlesEvent {
  const StayShuttlesEvent();
}

class StayShuttlesOpened extends StayShuttlesEvent {
  const StayShuttlesOpened(this.reference);
  final String reference;
}

class StayShuttlesRefreshRequested extends StayShuttlesEvent {
  const StayShuttlesRefreshRequested();
}

class StayShuttlesTicked extends StayShuttlesEvent {
  const StayShuttlesTicked();
}

@freezed
abstract class StayShuttlesState with _$StayShuttlesState {
  const StayShuttlesState._();

  const factory StayShuttlesState({
    String? reference,
    @Default(ViewState.idle) ViewState loadState,
    StayShuttlesModel? data,
    String? errorCode,
    required DateTime now,
  }) = _StayShuttlesState;

  /// The block is shown from the arrival day to the return day.
  bool get visible => data?.visible ?? false;
}

/// "Navette" block of a booking (S-A, 04/10/2026): the parking's running shuttles from the arrival day
/// to the return day, their vehicle, driver first name, position and distance, polled every
/// [pollInterval] (12 s) while the booking is open. Outside those days the first answer says so and
/// the polling stops. Nothing is stored on the phone.
class StayShuttlesBloc extends Bloc<StayShuttlesEvent, StayShuttlesState> {
  StayShuttlesBloc(this._get, {Clock clock = systemClock, Duration pollInterval = const Duration(seconds: 12), bool autoPoll = true})
    : _clock = clock,
      _pollInterval = pollInterval,
      _autoPoll = autoPoll,
      super(StayShuttlesState(now: clock())) {
    on<StayShuttlesOpened>(_onOpened);
    on<StayShuttlesRefreshRequested>((e, emit) => _load(emit, initial: false));
    on<StayShuttlesTicked>((e, emit) => _load(emit, initial: false));
  }

  final GetStayShuttlesUseCase _get;
  final Clock _clock;
  final Duration _pollInterval;
  final bool _autoPoll;
  Timer? _timer;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onOpened(StayShuttlesOpened event, Emitter<StayShuttlesState> emit) async {
    emit(state.copyWith(reference: event.reference.toUpperCase(), loadState: ViewState.processing, now: _clock()));
    await _load(emit, initial: true);
    if (_autoPoll && state.visible) _timer ??= Timer.periodic(_pollInterval, (_) => add(const StayShuttlesTicked()));
  }

  Future<void> _load(Emitter<StayShuttlesState> emit, {required bool initial}) async {
    final reference = state.reference;
    if (reference == null) return;
    final result = await _get(reference);
    result.fold(
      (failure) => emit(state.copyWith(loadState: initial ? ViewState.error : state.loadState, errorCode: _code(failure), now: _clock())),
      (data) {
        emit(state.copyWith(loadState: ViewState.success, data: data, errorCode: null, now: _clock()));
        if (!data.visible) {
          // Outside the stay: nothing to follow until the booking is reopened.
          _timer?.cancel();
          _timer = null;
        }
      },
    );
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}

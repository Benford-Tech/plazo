// ignore_for_file: prefer_initializing_formals
import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/clock.dart';
import '../../data/models/return_model.dart';
import '../../domain/usecases/return_use_cases.dart';

part 'return_bloc.freezed.dart';
part 'return_event.dart';
part 'return_state.dart';

/// "Votre retour aujourd'hui": the flight (tracked by the API, or declared landed), the meeting
/// point, and the shuttle coming for the traveller.
///
/// Polling (no push for travellers yet): every [pollInterval] (10 s) while a shuttle trip is on
/// its way (its position and ETA), else every [refreshEvery] ticks (30 s) for the flight and the
/// trip start. Stops when the trip ends. Nothing is stored on the phone.
class ReturnBloc extends Bloc<ReturnEvent, ReturnState> {
  ReturnBloc(
    this._get,
    this._landed,
    this._shuttle, {
    Clock clock = systemClock,
    Duration pollInterval = const Duration(seconds: 10),
    this.refreshEvery = 3,
    bool autoPoll = true,
  }) : _clock = clock,
       _pollInterval = pollInterval,
       _autoPoll = autoPoll,
       super(ReturnState(now: clock())) {
    on<ReturnOpened>(_onOpened);
    on<ReturnRefreshRequested>(_onRefresh);
    on<ReturnLandedDeclared>(_onLanded);
    on<ReturnTicked>(_onTicked);
  }

  final GetReturnUseCase _get;
  final DeclareLandedUseCase _landed;
  final GetShuttleStatusUseCase _shuttle;
  final Clock _clock;
  final Duration _pollInterval;
  final int refreshEvery;
  final bool _autoPoll;
  Timer? _timer;
  int _ticks = 0;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onOpened(ReturnOpened event, Emitter<ReturnState> emit) async {
    emit(state.copyWith(reference: event.reference.toUpperCase(), loadState: ViewState.processing, now: _clock()));
    await _load(emit, initial: true);
    if (_autoPoll) _timer ??= Timer.periodic(_pollInterval, (_) => add(const ReturnTicked()));
  }

  Future<void> _onRefresh(ReturnRefreshRequested event, Emitter<ReturnState> emit) => _load(emit, initial: false);

  Future<void> _load(Emitter<ReturnState> emit, {required bool initial}) async {
    final reference = state.reference;
    if (reference == null) return;
    final result = await _get(reference);
    result.fold(
      (failure) => emit(state.copyWith(loadState: initial ? ViewState.error : state.loadState, errorCode: _code(failure), now: _clock())),
      (data) => emit(state.copyWith(loadState: ViewState.success, data: data, errorCode: null, now: _clock())),
    );
  }

  Future<void> _onLanded(ReturnLandedDeclared event, Emitter<ReturnState> emit) async {
    final reference = state.reference;
    if (reference == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final result = await _landed(reference);
    result.fold(
      (failure) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))),
      (data) => emit(state.copyWith(actionState: ViewState.success, data: data, now: _clock())),
    );
  }

  /// Shuttle on its way: its status every tick; otherwise the whole block every [refreshEvery] ticks.
  Future<void> _onTicked(ReturnTicked event, Emitter<ReturnState> emit) async {
    final reference = state.reference;
    final data = state.data;
    if (reference == null || data == null) return;
    _ticks += 1;
    if (data.shuttleRunning) {
      final result = await _shuttle(reference);
      await result.fold((failure) async => emit(state.copyWith(now: _clock())), (status) async {
        if (status.shuttle == null) {
          // The trip ended (travellers picked up, or 90 minutes): back to the full picture.
          emit(state.copyWith(data: data.copyWith(shuttle: null), shuttleEndedAt: _clock(), now: _clock()));
          await _load(emit, initial: false);
        } else {
          emit(state.copyWith(data: data.copyWith(shuttle: status.shuttle), now: _clock()));
        }
      });
      return;
    }
    if (_ticks % refreshEvery == 0) {
      await _load(emit, initial: false);
    } else {
      emit(state.copyWith(now: _clock()));
    }
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}

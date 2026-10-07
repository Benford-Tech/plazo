import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/utils/clock.dart';
import '../../data/models/shuttle_models.dart';
import '../../domain/usecases/shuttle_use_cases.dart';

part 'shuttle_waves_bloc.freezed.dart';

sealed class ShuttleWavesEvent {
  const ShuttleWavesEvent();
}

class ShuttleWavesStarted extends ShuttleWavesEvent {
  const ShuttleWavesStarted();
}

class ShuttleWavesPolled extends ShuttleWavesEvent {
  const ShuttleWavesPolled();
}

/// Today (0), tomorrow (1) or the day after (2).
class ShuttleWavesDayChanged extends ShuttleWavesEvent {
  const ShuttleWavesDayChanged(this.dayOffset);
  final int dayOffset;
}

@freezed
abstract class ShuttleWavesState with _$ShuttleWavesState {
  const ShuttleWavesState._();

  const factory ShuttleWavesState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(0) int dayOffset,
    ShuttleForecastModel? data,
    String? errorCode,
    required DateTime now,
  }) = _ShuttleWavesState;

  List<ShuttleWaveModel> get waves => data?.waves ?? const [];
  bool get loaded => data != null;

  /// The first wave still to run (today only).
  ShuttleWaveModel? get next => dayOffset == 0 ? upcoming.where((w) => w.planned).firstOrNull : null;

  /// Today, a wave is past once it is done or should have left more than 30 minutes ago.
  bool isPast(ShuttleWaveModel w) => dayOffset == 0 && (w.state == 'done' || w.leaveAt.isBefore(now.subtract(const Duration(minutes: 30))));

  /// The waves the driver still has ahead (every wave of another day).
  List<ShuttleWaveModel> get upcoming => waves.where((w) => !isPast(w)).toList();

  /// Today's waves already behind, folded under "N créneaux passés".
  List<ShuttleWaveModel> get past => waves.where(isPast).toList();
}

/// V-A "Ligne du jour" (05/10/2026): the day's shuttle waves, polled every [pollInterval]
/// (30 s) while the screen is open; the day can be moved to tomorrow or the day after.
class ShuttleWavesBloc extends Bloc<ShuttleWavesEvent, ShuttleWavesState> {
  ShuttleWavesBloc(this._forecast, {Clock clock = systemClock, this.pollInterval = const Duration(seconds: 30), this.autoPoll = true})
    : _clock = clock,
      super(ShuttleWavesState(now: clock())) {
    on<ShuttleWavesStarted>(_onStarted);
    on<ShuttleWavesPolled>((e, emit) => _load(emit, initial: false));
    on<ShuttleWavesDayChanged>(_onDayChanged);
  }

  final GetShuttleForecastUseCase _forecast;
  final Clock _clock;
  final Duration pollInterval;
  final bool autoPoll;
  Timer? _timer;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  String? get _date => state.dayOffset == 0 ? null : isoDay(_clock().add(Duration(days: state.dayOffset)));

  Future<void> _onStarted(ShuttleWavesStarted event, Emitter<ShuttleWavesState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, now: _clock()));
    await _load(emit, initial: true);
    if (autoPoll) _timer ??= Timer.periodic(pollInterval, (_) => add(const ShuttleWavesPolled()));
  }

  Future<void> _onDayChanged(ShuttleWavesDayChanged event, Emitter<ShuttleWavesState> emit) async {
    if (event.dayOffset == state.dayOffset) return;
    emit(state.copyWith(dayOffset: event.dayOffset, viewState: ViewState.processing, data: null, now: _clock()));
    await _load(emit, initial: true);
  }

  Future<void> _load(Emitter<ShuttleWavesState> emit, {required bool initial}) async {
    final offset = state.dayOffset;
    final result = await _forecast(_date);
    if (offset != state.dayOffset) return; // the day moved meanwhile
    result.fold(
      (failure) => emit(state.copyWith(viewState: initial ? ViewState.error : state.viewState, errorCode: _code(failure), now: _clock())),
      (data) => emit(state.copyWith(viewState: ViewState.success, data: data, errorCode: null, now: _clock())),
    );
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}

import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:latlong2/latlong.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../shared/widgets/shuttle_icon.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/clock.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/shuttle_models.dart';
import '../../domain/usecases/shuttle_use_cases.dart';

part 'live_shuttles_bloc.freezed.dart';

sealed class LiveShuttlesEvent {
  const LiveShuttlesEvent();
}

class LiveShuttlesStarted extends LiveShuttlesEvent {
  const LiveShuttlesStarted();
}

class LiveShuttlesPolled extends LiveShuttlesEvent {
  const LiveShuttlesPolled();
}

@freezed
abstract class LiveShuttlesState with _$LiveShuttlesState {
  const LiveShuttlesState._();

  const factory LiveShuttlesState({
    @Default(ViewState.idle) ViewState viewState,
    LiveShuttlesModel? data,
    String? errorCode,
    required DateTime now,

    /// I-C: the heading of each moving shuttle, from its previous position (trip id → degrees).
    @Default(<String, double>{}) Map<String, double> headings,
  }) = _LiveShuttlesState;

  List<LiveTripModel> get trips => data?.trips ?? const [];
  bool get loaded => data != null;
}

/// P-A (05/10/2026): the operator's running shuttles for the whole team (position, where they go,
/// how far), polled every [pollInterval] (12 s) while the screen is open. Nothing is stored.
class LiveShuttlesBloc extends Bloc<LiveShuttlesEvent, LiveShuttlesState> {
  LiveShuttlesBloc(this._live, {Clock clock = systemClock, this.pollInterval = const Duration(seconds: 12), this.autoPoll = true})
    : _clock = clock,
      super(LiveShuttlesState(now: clock())) {
    on<LiveShuttlesStarted>(_onStarted);
    on<LiveShuttlesPolled>((e, emit) => _load(emit, initial: false));
  }

  final GetLiveShuttlesUseCase _live;
  final Clock _clock;
  final Duration pollInterval;
  final bool autoPoll;
  Timer? _timer;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(LiveShuttlesStarted event, Emitter<LiveShuttlesState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, now: _clock()));
    await _load(emit, initial: true);
    if (autoPoll) _timer ??= Timer.periodic(pollInterval, (_) => add(const LiveShuttlesPolled()));
  }

  Future<void> _load(Emitter<LiveShuttlesState> emit, {required bool initial}) async {
    final result = await _live(NoParams());
    result.fold(
      (failure) => emit(state.copyWith(viewState: initial ? ViewState.error : state.viewState, errorCode: _code(failure), now: _clock())),
      (data) {
        final before = {for (final t in state.trips) if (t.position != null) t.id: LatLng(t.position!.lat, t.position!.lng)};
        final now = {for (final t in data.trips) if (t.position != null) t.id: LatLng(t.position!.lat, t.position!.lng)};
        emit(state.copyWith(viewState: ViewState.success, data: data, errorCode: null, now: _clock(), headings: shuttleHeadings(before, state.headings, now)));
      },
    );
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}

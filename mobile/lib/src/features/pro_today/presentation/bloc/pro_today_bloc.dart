import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/utils/clock.dart';
import '../../../../core/utils/use_case.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../data/models/planning_model.dart';
import '../../data/models/staff_signal_model.dart';
import '../../domain/usecases/get_live_arrivals_use_case.dart';
import '../../domain/usecases/get_planning_use_case.dart';

part 'pro_today_bloc.freezed.dart';
part 'pro_today_event.dart';
part 'pro_today_state.dart';

/// The staff's day: arrivals and returns, with the travellers' live signals polled every 12 s
/// (the planning itself every minute). A new event (sharing, announce, arrival) shows a banner.
class ProTodayBloc extends Bloc<ProTodayEvent, ProTodayState> {
  ProTodayBloc(
    this._planning,
    this._live, {
    Clock clock = systemClock,
    this._pollInterval = const Duration(seconds: 12),
    this._planningEvery = const Duration(minutes: 1),
    this._autoPoll = true,
  }) : _clock = clock,
       super(ProTodayState(now: clock())) {
    on<ProTodayStarted>(_onStarted);
    on<ProTodayPolled>(_onPolled);
    on<ProTodayDateChanged>(_onDateChanged);
    on<ProTodayBannerDismissed>((event, emit) => emit(state.copyWith(banner: null)));
  }

  final GetPlanningUseCase _planning;
  final GetLiveArrivalsUseCase _live;
  final Clock _clock;
  final Duration _pollInterval;
  final Duration _planningEvery;
  final bool _autoPoll;
  Timer? _timer;
  DateTime? _planningAt;
  final Set<String> _seen = {};

  Future<void> _onStarted(ProTodayStarted event, Emitter<ProTodayState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing));
    await _refresh(emit, planning: true);
    if (_autoPoll) _timer ??= Timer.periodic(_pollInterval, (_) => add(const ProTodayPolled()));
  }

  Future<void> _onPolled(ProTodayPolled event, Emitter<ProTodayState> emit) async {
    final due = _planningAt == null || _clock().difference(_planningAt!) >= _planningEvery;
    await _refresh(emit, planning: due || event.full);
  }

  Future<void> _onDateChanged(ProTodayDateChanged event, Emitter<ProTodayState> emit) async {
    if (event.date == state.date) return;
    emit(state.copyWith(date: event.date, viewState: state.planning == null ? ViewState.processing : state.viewState));
    await _refresh(emit, planning: true);
  }

  Future<void> _refresh(Emitter<ProTodayState> emit, {required bool planning}) async {
    if (planning) {
      final date = state.date;
      final result = await _planning(date);
      // The day changed while loading: this answer is stale.
      if (state.date != date) return;
      result.fold((failure) => emit(state.copyWith(viewState: state.planning == null ? ViewState.error : state.viewState, errorMessage: failure.message)), (p) {
        _planningAt = _clock();
        emit(state.copyWith(planning: p, viewState: ViewState.success, errorMessage: null));
      });
    }
    final live = await _live(NoParams());
    live.fold((failure) => emit(state.copyWith(errorMessage: failure.message)), (data) {
      final fresh = data.signals.where((s) => !_seen.contains(s.eventKey)).toList();
      _seen.addAll(fresh.map((s) => s.eventKey));
      final banner = fresh.isNotEmpty ? fresh.first : (state.banner != null && data.signals.any((s) => s.id == state.banner!.id) ? state.banner : null);
      emit(state.copyWith(signals: data.signals, fetchedAt: _clock(), now: _clock(), banner: banner, errorMessage: null));
    });
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}

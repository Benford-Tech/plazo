import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/utils/clock.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/dashboard_model.dart';
import '../../domain/usecases/get_dashboard_use_case.dart';

part 'pro_dashboard_bloc.freezed.dart';

sealed class ProDashboardEvent {
  const ProDashboardEvent();
}

class ProDashboardStarted extends ProDashboardEvent {
  const ProDashboardStarted();
}

class ProDashboardPolled extends ProDashboardEvent {
  const ProDashboardPolled();
}

@freezed
abstract class ProDashboardState with _$ProDashboardState {
  const factory ProDashboardState({@Default(ViewState.idle) ViewState viewState, DashboardModel? data, String? errorMessage, required DateTime now}) =
      _ProDashboardState;
}

/// The pro home (05/10/2026): the day's figures, the services, what to treat first and the vehicles
/// on the parking, polled every [pollInterval] (30 s) while shown. The shuttles have their own bloc.
class ProDashboardBloc extends Bloc<ProDashboardEvent, ProDashboardState> {
  ProDashboardBloc(this._dashboard, {Clock clock = systemClock, this.pollInterval = const Duration(seconds: 30), this.autoPoll = true})
    : _clock = clock,
      super(ProDashboardState(now: clock())) {
    on<ProDashboardStarted>(_onStarted);
    on<ProDashboardPolled>((e, emit) => _load(emit));
  }

  final GetDashboardUseCase _dashboard;
  final Clock _clock;
  final Duration pollInterval;
  final bool autoPoll;
  Timer? _timer;

  Future<void> _onStarted(ProDashboardStarted event, Emitter<ProDashboardState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, now: _clock()));
    await _load(emit);
    if (autoPoll) _timer ??= Timer.periodic(pollInterval, (_) => add(const ProDashboardPolled()));
  }

  Future<void> _load(Emitter<ProDashboardState> emit) async {
    final result = await _dashboard(NoParams());
    result.fold(
      // A failed poll keeps the last figures on screen.
      (failure) => emit(state.copyWith(viewState: state.data == null ? ViewState.error : state.viewState, errorMessage: failure.message, now: _clock())),
      (data) => emit(state.copyWith(viewState: ViewState.success, data: data, errorMessage: null, now: _clock())),
    );
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}

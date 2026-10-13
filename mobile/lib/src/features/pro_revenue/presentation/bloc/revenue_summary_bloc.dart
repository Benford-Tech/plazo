import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/revenue_models.dart';
import '../../domain/usecases/revenue_use_cases.dart';

part 'revenue_summary_bloc.freezed.dart';

sealed class RevenueSummaryEvent {
  const RevenueSummaryEvent();
}

class RevenueSummaryStarted extends RevenueSummaryEvent {
  const RevenueSummaryStarted();
}

/// Pull to refresh, the 5-minute tick, or back from the revenue page (amounts completed there).
class RevenueSummaryRefreshed extends RevenueSummaryEvent {
  const RevenueSummaryRefreshed();
}

@freezed
abstract class RevenueSummaryState with _$RevenueSummaryState {
  const factory RevenueSummaryState({@Default(ViewState.idle) ViewState viewState, RevenueSummaryModel? data}) = _RevenueSummaryState;
}

/// T-A (13/10/2026): the dashboard's revenue card, managers only (the provider is lazy: nobody else asks for it).
/// Read every [pollInterval] (5 min, as on the web); a failed read keeps the last figures, a first one hides the card.
class RevenueSummaryBloc extends Bloc<RevenueSummaryEvent, RevenueSummaryState> {
  RevenueSummaryBloc(this._summary, {Stream<void>? changes, this.pollInterval = const Duration(minutes: 5), this.autoPoll = true})
    : super(const RevenueSummaryState()) {
    on<RevenueSummaryStarted>(_onStarted);
    on<RevenueSummaryRefreshed>((e, emit) => _load(emit));
    // An amount saved anywhere in the app (the revenue page, opened from the card or from Plus) counts at once.
    _changes = changes?.listen((_) {
      if (!isClosed) add(const RevenueSummaryRefreshed());
    });
  }

  final GetRevenueSummaryUseCase _summary;
  final Duration pollInterval;
  final bool autoPoll;
  Timer? _timer;
  StreamSubscription<void>? _changes;

  Future<void> _onStarted(RevenueSummaryStarted event, Emitter<RevenueSummaryState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing));
    await _load(emit);
    // Closed during the first read (the tab left): no timer.
    if (autoPoll && !isClosed) {
      _timer ??= Timer.periodic(pollInterval, (_) {
        if (!isClosed) add(const RevenueSummaryRefreshed());
      });
    }
  }

  Future<void> _load(Emitter<RevenueSummaryState> emit) async {
    final result = await _summary(NoParams());
    result.fold(
      (_) => emit(state.copyWith(viewState: state.data == null ? ViewState.error : state.viewState)),
      (data) => emit(state.copyWith(viewState: ViewState.success, data: data)),
    );
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    _changes?.cancel();
    return super.close();
  }
}

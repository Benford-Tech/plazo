import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:latlong2/latlong.dart';

import '../../../../../core/enums/view_state.dart';
import '../../../../../core/helpers/highlights.dart';
import '../../../../../core/utils/clock.dart';
import '../../../../../shared/widgets/shuttle_icon.dart';
import '../../../data/models/public_models.dart';
import '../../../domain/logic/filters.dart';
import '../../../domain/logic/shuttle_rail.dart';
import '../../../domain/usecases/public_use_cases.dart';

part 'results_bloc.freezed.dart';
part 'results_event.dart';
part 'results_state.dart';

enum ResultsView { list, map }

/// A2, the results of a search: the API's offers, narrowed and ordered by the same filters and
/// sorts as the site; list by default, map (IGN plan, price pills) in one tap. L3 (14/10/2026): while the screen is
/// shown and one of its parkings shows its shuttles live, ONE poll of the airport's live answer every [pollInterval]
/// feeds every card's rail (never one request per card).
class ResultsBloc extends Bloc<ResultsEvent, ResultsState> {
  ResultsBloc(
    this._search, {
    required String airport,
    required String arrivalAt,
    required String returnAt,
    this.live,
    this.clock = systemClock,
    this.pollInterval = const Duration(seconds: 12),
    this.autoPoll = true,
  }) : super(ResultsState(airport: airport, arrivalAt: arrivalAt, returnAt: returnAt)) {
    on<ResultsRequested>(_onRequested);
    on<ResultsStayChanged>(_onStayChanged);
    on<ResultsFiltersChanged>((event, emit) => emit(state.copyWith(filters: event.filters, selectedSlug: null)));
    on<ResultsSortChanged>((event, emit) => emit(state.copyWith(filters: state.filters.copyWith(sort: event.sort))));
    on<ResultsViewChanged>(_onViewChanged);
    on<ResultsSelected>((event, emit) => emit(state.copyWith(selectedSlug: event.slug)));
    on<ResultsLivePolled>(_onLivePolled);
    on<ResultsShownChanged>(_onShownChanged);
  }

  final SearchParkingsUseCase _search;

  /// The airport's live answer (K-A's use case); absent in most tests: no rail data then.
  final GetAirportLiveUseCase? live;
  final Duration pollInterval;

  /// Off in the widget tests: the first poll still runs, the timer does not.
  final bool autoPoll;

  /// When an answer came (the rails' « il y a 8 s » runs on from there).
  final Clock clock;
  Timer? _timer;

  /// The screen is in view (not covered by another page, app in the foreground).
  bool _shown = true;

  /// A poll is on its way: the next one waits for it (a slow answer would otherwise land after a newer one).
  bool _polling = false;

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }

  /// Polls only while the screen is shown and one of its parkings shows its shuttles live.
  bool get _wantsLive => live != null && _shown && state.results.any((r) => r.liveShuttle);

  void _syncTimer() {
    if (_wantsLive && autoPoll) {
      _timer ??= Timer.periodic(pollInterval, (_) => add(const ResultsLivePolled()));
    } else {
      _timer?.cancel();
      _timer = null;
    }
  }

  /// A failed poll keeps the last answer (the rails keep their minibuses until the next one). One poll at a time: a
  /// tick or a return in view while one is on its way is skipped, its answer being as fresh.
  Future<void> _onLivePolled(ResultsLivePolled event, Emitter<ResultsState> emit) async {
    final fetch = live;
    if (fetch == null || !_wantsLive || _polling) return;
    _polling = true;
    final result = await fetch(state.airport).whenComplete(() => _polling = false);
    result.fold((_) {}, (data) {
      final before = {
        for (final s in state.live?.shuttles ?? const <LiveShuttleModel>[])
          if (s.position != null) s.id: LatLng(s.position!.lat, s.position!.lng),
      };
      final now = {
        for (final s in data.shuttles)
          if (s.position != null) s.id: LatLng(s.position!.lat, s.position!.lng),
      };
      emit(state.copyWith(live: data, liveAt: clock(), headings: shuttleHeadings(before, state.headings, now)));
    });
  }

  void _onShownChanged(ResultsShownChanged event, Emitter<ResultsState> emit) {
    if (event.shown == _shown) return;
    _shown = event.shown;
    // Back in view: the positions are stale, ask at once.
    if (_wantsLive) add(const ResultsLivePolled());
    _syncTimer();
  }

  Future<void> _onRequested(ResultsRequested event, Emitter<ResultsState> emit) async {
    emit(state.copyWith(loadState: ViewState.processing, errorMessage: null, errorCode: null));
    final result = await _search(StayParams(airport: state.airport, arrivalAt: state.arrivalAt, returnAt: state.returnAt));
    result.fold(
      (failure) => emit(
        state.copyWith(
          loadState: ViewState.error,
          errorMessage: failure.message,
          // A date refused by the API: its field code ("arrival_in_past"…).
          errorCode: failure.fields?.values.firstOrNull ?? failure.code,
        ),
      ),
      (response) => emit(state.copyWith(loadState: ViewState.success, response: response, selectedSlug: null)),
    );
    if (_wantsLive && _timer == null) add(const ResultsLivePolled());
    _syncTimer();
  }

  Future<void> _onStayChanged(ResultsStayChanged event, Emitter<ResultsState> emit) async {
    emit(state.copyWith(arrivalAt: event.arrivalAt, returnAt: event.returnAt));
    await _onRequested(const ResultsRequested(), emit);
  }

  void _onViewChanged(ResultsViewChanged event, Emitter<ResultsState> emit) {
    // On the map, a parking is selected at once: the first one available (or the first one).
    final selected = state.selectedSlug ?? (event.view == ResultsView.map ? state.shown.firstOrNull?.slug : null);
    emit(state.copyWith(view: event.view, selectedSlug: selected));
  }
}

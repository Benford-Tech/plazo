import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../../core/constants/app_constants.dart';
import '../../../../../core/enums/view_state.dart';
import '../../../../../core/helpers/stay.dart';
import '../../../../../core/utils/clock.dart';
import '../../../../../core/utils/use_case.dart';
import '../../../data/models/public_models.dart';
import '../../../domain/usecases/public_use_cases.dart';

part 'search_bloc.freezed.dart';
part 'search_event.dart';
part 'search_state.dart';

/// A1, the search: airport (a picker when there is more than one) and the stay, as on the site.
class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc(this._airports, {this.preview, this.live, Clock clock = systemClock, this.pollInterval = const Duration(seconds: 12), this.autoPoll = true})
    : _clock = clock,
      super(SearchState.initial(clock())) {
    on<SearchStarted>(_onStarted);
    on<SearchAirportChanged>(_onAirportChanged);
    on<SearchPreviewRequested>(_onPreviewRequested);
    on<SearchStayChanged>(_onStayChanged);
    on<SearchSubmitted>(_onSubmitted);
    on<SearchLivePolled>(_onLivePolled);
    on<SearchParkingSelected>((e, emit) => emit(state.copyWith(selectedSlug: e.slug)));
  }

  final GetAirportsUseCase _airports;

  /// The home's preview search (T-A); absent in the tests that only need the dates.
  final SearchParkingsUseCase? preview;

  /// K-A: the live layer (shuttles on the road), polled every [pollInterval]; absent in most tests.
  final GetAirportLiveUseCase? live;
  final Duration pollInterval;
  final bool autoPoll;
  Timer? _timer;
  final Clock _clock;

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }

  Future<void> _onStarted(SearchStarted event, Emitter<SearchState> emit) async {
    emit(state.copyWith(loadState: ViewState.processing));
    final result = await _airports(NoParams());
    result.fold(
      // Without the list, the default airport still works (its name is in the texts).
      (_) => emit(state.copyWith(loadState: ViewState.error)),
      (airports) => emit(state.copyWith(loadState: ViewState.success, airports: airports)),
    );
    add(const SearchPreviewRequested());
    if (live != null) {
      add(const SearchLivePolled());
      if (autoPoll) _timer ??= Timer.periodic(pollInterval, (_) => add(const SearchLivePolled()));
    }
  }

  void _onAirportChanged(SearchAirportChanged event, Emitter<SearchState> emit) {
    emit(state.copyWith(airportSlug: event.slug, live: null, liveAt: null, selectedSlug: null));
    add(const SearchPreviewRequested());
    if (live != null) add(const SearchLivePolled());
  }

  /// K-A: a failed poll keeps the last answer (the map still shows the parkings).
  Future<void> _onLivePolled(SearchLivePolled event, Emitter<SearchState> emit) async {
    final fetch = live;
    if (fetch == null) return;
    final slug = state.airportSlug;
    final result = await fetch(slug);
    if (slug != state.airportSlug) return;
    result.fold((_) {}, (data) => emit(state.copyWith(live: data, liveAt: _clock())));
  }

  void _onStayChanged(SearchStayChanged event, Emitter<SearchState> emit) {
    emit(state.copyWith(arrivalAt: event.arrivalAt, returnAt: event.returnAt, errors: const {}));
    add(const SearchPreviewRequested());
  }

  /// T-A (05/10/2026): the home shows the parkings of the chosen stay on the map, and the best offer.
  Future<void> _onPreviewRequested(SearchPreviewRequested event, Emitter<SearchState> emit) async {
    final search = preview;
    if (search == null) return;
    final params = StayParams(airport: state.airportSlug, arrivalAt: state.arrivalAt, returnAt: state.returnAt);
    emit(state.copyWith(previewState: ViewState.processing));
    final result = await search(params);
    // The stay changed while loading: this answer is stale.
    if (params.airport != state.airportSlug || params.arrivalAt != state.arrivalAt || params.returnAt != state.returnAt) return;
    result.fold(
      (_) => emit(state.copyWith(previewState: ViewState.error)),
      (response) => emit(state.copyWith(previewState: ViewState.success, preview: response, previewAt: _clock())),
    );
  }

  void _onSubmitted(SearchSubmitted event, Emitter<SearchState> emit) {
    final errors = validateStay(state.arrivalAt, state.returnAt, _clock());
    emit(state.copyWith(errors: errors, submitted: errors.isEmpty ? state.submitted + 1 : state.submitted));
  }
}

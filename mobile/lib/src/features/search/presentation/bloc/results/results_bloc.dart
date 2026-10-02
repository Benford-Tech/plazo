import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../../core/enums/view_state.dart';
import '../../../data/models/public_models.dart';
import '../../../domain/logic/filters.dart';
import '../../../domain/usecases/public_use_cases.dart';

part 'results_bloc.freezed.dart';
part 'results_event.dart';
part 'results_state.dart';

enum ResultsView { list, map }

/// A2, the results of a search: the API's offers, narrowed and ordered by the same filters and
/// sorts as the site; list by default, map (IGN plan, price pills) in one tap.
class ResultsBloc extends Bloc<ResultsEvent, ResultsState> {
  ResultsBloc(this._search, {required String airport, required String arrivalAt, required String returnAt})
    : super(ResultsState(airport: airport, arrivalAt: arrivalAt, returnAt: returnAt)) {
    on<ResultsRequested>(_onRequested);
    on<ResultsStayChanged>(_onStayChanged);
    on<ResultsFiltersChanged>((event, emit) => emit(state.copyWith(filters: event.filters, selectedSlug: null)));
    on<ResultsSortChanged>((event, emit) => emit(state.copyWith(filters: state.filters.copyWith(sort: event.sort))));
    on<ResultsViewChanged>(_onViewChanged);
    on<ResultsSelected>((event, emit) => emit(state.copyWith(selectedSlug: event.slug)));
  }

  final SearchParkingsUseCase _search;

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

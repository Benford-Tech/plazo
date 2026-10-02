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
  SearchBloc(this._airports, {Clock clock = systemClock}) : _clock = clock, super(SearchState.initial(clock())) {
    on<SearchStarted>(_onStarted);
    on<SearchAirportChanged>((event, emit) => emit(state.copyWith(airportSlug: event.slug)));
    on<SearchStayChanged>(_onStayChanged);
    on<SearchSubmitted>(_onSubmitted);
  }

  final GetAirportsUseCase _airports;
  final Clock _clock;

  Future<void> _onStarted(SearchStarted event, Emitter<SearchState> emit) async {
    emit(state.copyWith(loadState: ViewState.processing));
    final result = await _airports(NoParams());
    result.fold(
      // Without the list, the default airport still works (its name is in the texts).
      (_) => emit(state.copyWith(loadState: ViewState.error)),
      (airports) => emit(state.copyWith(loadState: ViewState.success, airports: airports)),
    );
  }

  void _onStayChanged(SearchStayChanged event, Emitter<SearchState> emit) {
    emit(state.copyWith(arrivalAt: event.arrivalAt, returnAt: event.returnAt, errors: const {}));
  }

  void _onSubmitted(SearchSubmitted event, Emitter<SearchState> emit) {
    final errors = validateStay(state.arrivalAt, state.returnAt, _clock());
    emit(state.copyWith(errors: errors, submitted: errors.isEmpty ? state.submitted + 1 : state.submitted));
  }
}

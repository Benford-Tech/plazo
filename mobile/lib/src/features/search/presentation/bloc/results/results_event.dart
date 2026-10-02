part of 'results_bloc.dart';

sealed class ResultsEvent {
  const ResultsEvent();
}

class ResultsRequested extends ResultsEvent {
  const ResultsRequested();
}

/// "Modifier": new dates from the date sheet.
class ResultsStayChanged extends ResultsEvent {
  const ResultsStayChanged({required this.arrivalAt, required this.returnAt});
  final String arrivalAt;
  final String returnAt;
}

class ResultsFiltersChanged extends ResultsEvent {
  const ResultsFiltersChanged(this.filters);
  final Filters filters;
}

class ResultsSortChanged extends ResultsEvent {
  const ResultsSortChanged(this.sort);
  final SortKey sort;
}

class ResultsViewChanged extends ResultsEvent {
  const ResultsViewChanged(this.view);
  final ResultsView view;
}

/// A price pill tapped on the map (or a card): its card is selected.
class ResultsSelected extends ResultsEvent {
  const ResultsSelected(this.slug);
  final String? slug;
}

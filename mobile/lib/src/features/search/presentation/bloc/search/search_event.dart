part of 'search_bloc.dart';

sealed class SearchEvent {
  const SearchEvent();
}

class SearchStarted extends SearchEvent {
  const SearchStarted();
}

class SearchAirportChanged extends SearchEvent {
  const SearchAirportChanged(this.slug);
  final String slug;
}

class SearchStayChanged extends SearchEvent {
  const SearchStayChanged({required this.arrivalAt, required this.returnAt});
  final String arrivalAt;
  final String returnAt;
}

/// "Rechercher": checks the dates like the API; the page goes to the results when they are valid.
class SearchSubmitted extends SearchEvent {
  const SearchSubmitted();
}

/// The home's preview of the current stay (map and featured parking).
class SearchPreviewRequested extends SearchEvent {
  const SearchPreviewRequested();
}

/// K-A: the live layer's poll (every 12 s while the home is shown): parkings and shuttles on the road.
class SearchLivePolled extends SearchEvent {
  const SearchLivePolled();
}

/// K-A: a tap on a parking's pin — it becomes the orange card (null: back to the cheapest).
class SearchParkingSelected extends SearchEvent {
  const SearchParkingSelected(this.slug);
  final String? slug;
}

part of 'search_bloc.dart';

@freezed
abstract class SearchState with _$SearchState {
  const SearchState._();

  const factory SearchState({
    @Default(ViewState.idle) ViewState loadState,
    @Default(<AirportModel>[]) List<AirportModel> airports,
    required String airportSlug,
    required String arrivalAt,
    required String returnAt,

    /// API codes per field ("arrival_in_past"…), from the last "Rechercher".
    @Default(<String, String>{}) Map<String, String> errors,

    /// Incremented by each valid "Rechercher": the page navigates when it changes.
    @Default(0) int submitted,

    /// The parkings of the current stay, for the home's map and featured card (T-A).
    @Default(ViewState.idle) ViewState previewState,
    SearchResponseModel? preview,
    DateTime? previewAt,
  }) = _SearchState;

  /// Tomorrow 08:00 to a week later 18:00, at the default airport (as the site).
  factory SearchState.initial(DateTime now) {
    final stay = defaultStay(now);
    return SearchState(airportSlug: AppConstants.defaultAirport, arrivalAt: stay.arrival, returnAt: stay.returnAt);
  }

  AirportModel? get airport => airports.where((a) => a.slug == airportSlug).firstOrNull;

  int get days => stayDays(arrivalAt, returnAt);

  List<SearchResultModel> get bookable => preview?.results.where((r) => r.bookable).toList() ?? const [];

  /// The cheapest bookable parking of the stay: the home's orange card.
  SearchResultModel? get featured {
    final list = bookable;
    if (list.isEmpty) return null;
    return list.reduce((a, b) => a.priceCents! <= b.priceCents! ? a : b);
  }
}

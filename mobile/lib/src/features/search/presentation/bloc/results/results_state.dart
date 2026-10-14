part of 'results_bloc.dart';

@freezed
abstract class ResultsState with _$ResultsState {
  const ResultsState._();

  const factory ResultsState({
    required String airport,
    required String arrivalAt,
    required String returnAt,
    @Default(ViewState.idle) ViewState loadState,
    SearchResponseModel? response,
    @Default(Filters()) Filters filters,
    @Default(ResultsView.list) ResultsView view,
    String? selectedSlug,
    String? errorMessage,
    String? errorCode,

    /// L3: the airport's live answer (shuttles on the road), null until the first one; and when it came.
    AirportLiveModel? live,
    DateTime? liveAt,

    /// I-C: the heading of each moving shuttle, from its previous position (trip id → degrees).
    @Default(<String, double>{}) Map<String, double> headings,
  }) = _ResultsState;

  List<SearchResultModel> get results => response?.results ?? const [];

  int get ceilingCents => priceCeilingCents(results);

  /// The filters as applied: a limit at (or above) the slider's maximum is no limit (site's rule).
  Filters get effectiveFilters {
    final max = filters.maxPriceCents;
    return max != null && max >= ceilingCents ? filters.copyWith(maxPriceCents: () => null) : filters;
  }

  List<SearchResultModel> get shown => applyFilters(results, effectiveFilters);

  int get availableCount => shown.where((r) => r.bookable).length;

  /// Badges of the displayed results ("Le moins cher", "Navette la plus rapide"), by slug.
  Map<String, List<ResultBadge>> get badges => resultBadges(shown);

  bool get online => response?.payments == 'online';

  /// The live rail of a parking (L3); null until the first live answer (the rail's status then stays blank: nothing is
  /// known yet).
  RailState? railFor(SearchResultModel r) => live == null ? null : railState(live, r.slug, fallbackParking: r.location, headings: headings);
}

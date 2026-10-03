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
}

part of 'pro_occupation_bloc.dart';

@freezed
abstract class ProOccupationState with _$ProOccupationState {
  const ProOccupationState._();

  const factory ProOccupationState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    ParkingSummaryModel? parking,
    OccupationBoardModel? board,
    @Default('') String query,
    @Default([]) List<OccupantModel> results,
    @Default(false) bool searching,

    /// The vehicle whose card is open (from the search or the arrivals).
    OccupantModel? vehicle,

    /// A placement just happened: "GA-124-RB placé en A-05-10".
    String? notice,
    String? errorCode,
  }) = _ProOccupationState;

  List<SpotStateModel> get spots => board?.spots ?? const [];
  List<OccupantModel> get arrivals => board?.arrivals ?? const [];

  /// Free, active, non-reserved spots (for the picker), suggestions first.
  List<SpotStateModel> freeSpots({List<SuggestionModel> first = const []}) {
    final free = spots.where((s) => s.active && s.kind != 'reserved' && s.occupant == null).toList();
    final ids = first.map((s) => s.spotId).toList();
    free.sort((a, b) {
      final ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
      if (ia != ib) return (ia == -1 ? 1 << 20 : ia) - (ib == -1 ? 1 << 20 : ib);
      return a.code.compareTo(b.code);
    });
    return free;
  }
}

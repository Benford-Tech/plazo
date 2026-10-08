part of 'pro_occupation_bloc.dart';

@freezed
abstract class ProOccupationState with _$ProOccupationState {
  const ProOccupationState._();

  const factory ProOccupationState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    ParkingSummaryModel? parking,
    OccupationBoardModel? board,

    /// S-C (07/10/2026): the files of the parking; when it has some, the occupation reads in files.
    FileBoardModel? fileBoard,
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
  List<OccupantModel> get arrivals => filesMode ? fileBoard!.arrivals : board?.arrivals ?? const [];

  /// The parking is stored in files: the board, the arrivals and the cards speak files.
  bool get filesMode => fileBoard != null && fileBoard!.files.isNotEmpty;
  List<FileViewModel> get files => fileBoard?.files ?? const [];
  bool get loaded => board != null || fileBoard != null;

  /// The file a car stands in, from the file board.
  FileViewModel? fileOf(String reservationId) => files.where((f) => f.cars.any((c) => c.id == reservationId)).firstOrNull;

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

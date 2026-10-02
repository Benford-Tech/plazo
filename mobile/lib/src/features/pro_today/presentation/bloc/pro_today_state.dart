part of 'pro_today_bloc.dart';

/// A row of the day and the live signal that goes with it (the polled list wins).
class TodayRow {
  const TodayRow(this.booking, this.signal);
  final PlanningRowModel booking;
  final StaffSignalModel? signal;

  bool get approaching => signal?.state == ArrivalSignalState.sharing;
  bool get atMeetingPoint => signal?.state == ArrivalSignalState.atMeetingPoint;
}

@freezed
abstract class ProTodayState with _$ProTodayState {
  const ProTodayState._();

  const factory ProTodayState({
    @Default(ViewState.idle) ViewState viewState,
    PlanningModel? planning,
    @Default([]) List<StaffSignalModel> signals,
    StaffSignalModel? banner,
    DateTime? fetchedAt,
    required DateTime now,
    String? errorMessage,
  }) = _ProTodayState;

  List<TodayRow> get arrivals => _rows(planning?.arrivals ?? const [], ArrivalKind.outbound);
  List<TodayRow> get returns => _rows(planning?.returns ?? const [], ArrivalKind.returnTrip);

  /// Travellers at the meeting point, then those sharing (by ETA), then the rest in time order.
  List<TodayRow> _rows(List<PlanningRowModel> rows, ArrivalKind kind) {
    final withSignals = [
      for (final r in rows)
        TodayRow(r, signals.where((s) => s.kind == kind && s.reservationId == r.id).firstOrNull ?? (fetchedAt == null ? r.arrivalSignal : null)),
    ];
    int rank(TodayRow r) => r.atMeetingPoint ? 0 : (r.approaching ? 1 : 2);
    final indexed = withSignals.indexed.toList()
      ..sort((a, b) {
        final byRank = rank(a.$2).compareTo(rank(b.$2));
        if (byRank != 0) return byRank;
        if (rank(a.$2) == 1) return (a.$2.signal!.etaMinutes ?? 999).compareTo(b.$2.signal!.etaMinutes ?? 999);
        return a.$1.compareTo(b.$1);
      });
    return indexed.map((e) => e.$2).toList();
  }

  /// Age of a position at [at]: the server's figure plus the time since the poll.
  int? positionAge(StaffSignalModel s, DateTime at) {
    final age = s.positionAgeSeconds;
    if (age == null) return null;
    final since = fetchedAt == null ? 0 : at.difference(fetchedAt!).inSeconds;
    return age + (since < 0 ? 0 : since);
  }
}

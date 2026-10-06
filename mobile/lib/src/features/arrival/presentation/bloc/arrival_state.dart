part of 'arrival_bloc.dart';

@freezed
abstract class ArrivalState with _$ArrivalState {
  const ArrivalState._();

  const factory ArrivalState({
    String? reference,
    @Default(ViewState.idle) ViewState loadState,
    @Default(ViewState.idle) ViewState actionState,
    ArrivalModel? arrival,
    /// Positions are being watched and sent.
    @Default(false) bool tracking,
    @Default(false) bool showAnnounceOptions,

    /// E (06/10/2026): the word typed for the parking (sent with the next signal, empty: none).
    @Default('') String note,
    LocationAccess? locationProblem,
    /// API code (or consent_required, network): translated by the page.
    String? errorCode,
    /// The latest local position, for the map only (memory, never stored).
    GeoPosition? lastPosition,
    required DateTime now,
  }) = _ArrivalState;

  ArrivalSignalModel? get signal => arrival?.signal;

  /// The moment that can be signalled now (null: closed, or nothing left).
  ArrivalKind? get openKind {
    final moment = arrival?.moment;
    return moment != null && moment.open ? moment.kind : null;
  }

  /// Time left before the automatic stop (2 h after the start).
  Duration get remaining {
    final s = signal;
    if (s == null) return Duration.zero;
    final left = s.expiresAt.difference(now);
    return left.isNegative ? Duration.zero : left;
  }
}

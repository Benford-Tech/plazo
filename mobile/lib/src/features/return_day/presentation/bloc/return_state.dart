part of 'return_bloc.dart';

/// Which step of the return the traveller is at (the timeline of the approved design).
enum ReturnStep { flight, meetingPoint, shuttle, car }

@freezed
abstract class ReturnState with _$ReturnState {
  const ReturnState._();

  const factory ReturnState({
    String? reference,
    @Default(ViewState.idle) ViewState loadState,
    @Default(ViewState.idle) ViewState actionState,
    TravellerReturnModel? data,

    /// The trip that was on its way just ended (a short notice).
    DateTime? shuttleEndedAt,
    String? errorCode,
    required DateTime now,

    /// When the return state was last read from the API (the "En direct" pills count from it).
    DateTime? fetchedAt,
  }) = _ReturnState;

  /// Landed (by the API or the traveller) → at the meeting point → the shuttle on its way → the car.
  ReturnStep get step {
    final d = data;
    if (d == null) return ReturnStep.flight;
    if (d.shuttleRunning) return ReturnStep.shuttle;
    if (d.atMeetingPoint) return ReturnStep.shuttle;
    if (d.flight.landed) return ReturnStep.meetingPoint;
    return ReturnStep.flight;
  }
}

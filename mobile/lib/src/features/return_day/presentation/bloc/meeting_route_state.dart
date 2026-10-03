part of 'meeting_route_bloc.dart';

@freezed
abstract class MeetingRouteState with _$MeetingRouteState {
  const factory MeetingRouteState({
    String? reference,
    @Default(ViewState.idle) ViewState loadState,
    @Default(ViewState.idle) ViewState actionState,
    TravellerReturnModel? data,
    WalkingRouteModel? route,
    /// The route starts at the phone's position (else at the terminal).
    @Default(false) bool fromMe,
    LocationAccess? locationProblem,
    @Default(false) bool arrived,
    String? errorCode,
  }) = _MeetingRouteState;
}

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../services/location_service.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../../arrival/domain/usecases/at_meeting_point_use_case.dart';
import '../../data/models/return_model.dart';
import '../../domain/usecases/return_use_cases.dart';

part 'meeting_route_bloc.freezed.dart';
part 'meeting_route_event.dart';
part 'meeting_route_state.dart';

/// R2, the walking route to the meeting point: from the phone's position when the traveller
/// allows it (asked here, once), else from the terminal; computed by the API (IGN), with a
/// straight-line fallback the page points out. "Je suis arrivé au point de rendez-vous" sends
/// the arrival signal. The position is only used for the request, never stored.
class MeetingRouteBloc extends Bloc<MeetingRouteEvent, MeetingRouteState> {
  MeetingRouteBloc(this._getReturn, this._getRoute, this._atMeetingPoint, this._location) : super(const MeetingRouteState()) {
    on<MeetingRouteOpened>(_onOpened);
    on<MeetingRouteArrived>(_onArrived);
  }

  final GetReturnUseCase _getReturn;
  final GetWalkingRouteUseCase _getRoute;
  final AtMeetingPointUseCase _atMeetingPoint;
  final LocationService _location;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onOpened(MeetingRouteOpened event, Emitter<MeetingRouteState> emit) async {
    emit(state.copyWith(reference: event.reference.toUpperCase(), loadState: ViewState.processing, errorCode: null));
    final info = await _getReturn(event.reference);
    final data = info.fold((_) => null, (d) => d);
    if (data != null) emit(state.copyWith(data: data));
    final access = await _location.requestAccess();
    final from = access == LocationAccess.granted ? await _location.current() : null;
    emit(state.copyWith(locationProblem: access == LocationAccess.granted ? null : access));
    final result = await _getRoute(WalkingRouteParams(reference: event.reference, from: from));
    result.fold(
      (failure) => emit(state.copyWith(loadState: ViewState.error, errorCode: _code(failure))),
      (route) => emit(state.copyWith(loadState: ViewState.success, route: route, fromMe: from != null)),
    );
  }

  Future<void> _onArrived(MeetingRouteArrived event, Emitter<MeetingRouteState> emit) async {
    final reference = state.reference;
    if (reference == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final result = await _atMeetingPoint(AtMeetingPointParams(reference: reference, kind: ArrivalKind.returnTrip));
    result.fold(
      (failure) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))),
      (_) => emit(state.copyWith(actionState: ViewState.success, arrived: true)),
    );
  }
}

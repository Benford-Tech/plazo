part of 'pro_plan_bloc.dart';

/// The three screens of M-A: where, draw, generate.
enum PlanStep { locate, draw, generate }

const planLayouts = ['selfPark', 'valet24', 'valet5', 'valetEdge'];

@freezed
abstract class ProPlanState with _$ProPlanState {
  const ProPlanState._();

  const factory ProPlanState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    @Default(PlanStep.locate) PlanStep step,
    ParkingSummaryModel? parking,
    ParkingPlanViewModel? view,

    /// Where the map looks: the address, the phone, or the saved outline.
    LatLng? center,
    @Default([]) List<GeocodeResultModel> results,
    @Default(false) bool searching,
    LocationAccess? locationProblem,

    /// The corners being drawn (open ring, in order).
    @Default([]) List<LatLng> corners,
    PlanEstimateModel? estimate,
    @Default('valet24') String layout,

    /// The spots were just generated (their number is the capacity used everywhere).
    @Default(false) bool generated,
    String? errorCode,
  }) = _ProPlanState;

  double get areaM2 => polygonAreaM2(corners);
  bool get canValidate => corners.length >= 3;
  List<SpotModel> get spots => view?.spots ?? const [];
  int? countFor(String key) => estimate?.totals[key];
}

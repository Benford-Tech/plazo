import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/helpers/geo_rect.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../data/models/plan_models.dart';
import '../../domain/usecases/plan_use_cases.dart';

part 'pro_plan_bloc.freezed.dart';
part 'pro_plan_event.dart';
part 'pro_plan_state.dart';

/// Bloc 2, step "Plan" in the app (M-A + rectangle, 04/10/2026): find the land, tap its corners,
/// pick a layout; the server generates the numbered spots and applies the capacity.
class ProPlanBloc extends Bloc<ProPlanEvent, ProPlanState> {
  ProPlanBloc(this._getParking, this._getPlan, this._saveOutline, this._estimate, this._generate, this._geocode, this._location) : super(const ProPlanState()) {
    on<ProPlanStarted>(_onStarted);
    on<ProPlanAddressSearched>(_onSearched);
    on<ProPlanResultChosen>((e, emit) => emit(state.copyWith(center: LatLng(e.result.lat, e.result.lon), results: const [])));
    on<ProPlanGeolocateRequested>(_onGeolocate);
    on<ProPlanMapMoved>((e, emit) => emit(state.copyWith(center: e.center)));
    on<ProPlanStepChanged>((e, emit) => emit(state.copyWith(step: e.step, errorCode: null)));
    on<ProPlanCornerAdded>((e, emit) => emit(state.copyWith(corners: [...state.corners, e.point], generated: false)));
    on<ProPlanCornerMoved>((e, emit) {
      if (e.index < 0 || e.index >= state.corners.length) return;
      final next = [...state.corners];
      next[e.index] = e.point;
      emit(state.copyWith(corners: next));
    });
    on<ProPlanCornerRemoved>((e, emit) {
      if (e.index < 0 || e.index >= state.corners.length) return;
      emit(state.copyWith(corners: [...state.corners]..removeAt(e.index)));
    });
    on<ProPlanLastCornerUndone>((e, emit) {
      if (state.corners.isEmpty) return;
      emit(state.copyWith(corners: state.corners.sublist(0, state.corners.length - 1)));
    });
    on<ProPlanRectangleRequested>((e, emit) {
      if (state.corners.length < 2) return;
      emit(state.copyWith(corners: boundingRectangle(state.corners)));
    });
    on<ProPlanCornersCleared>((e, emit) => emit(state.copyWith(corners: const [])));
    on<ProPlanOutlineValidated>(_onValidated);
    on<ProPlanLayoutChosen>((e, emit) => emit(state.copyWith(layout: e.layout)));
    on<ProPlanGenerateRequested>(_onGenerate);
    on<ProPlanErrorDismissed>((e, emit) => emit(state.copyWith(errorCode: null, actionState: ViewState.idle)));
    on<_ProPlanEstimateRequested>(_onEstimate);
  }

  final GetProParkingUseCase _getParking;
  final GetPlanUseCase _getPlan;
  final SaveOutlineUseCase _saveOutline;
  final EstimatePlanUseCase _estimate;
  final GeneratePlanUseCase _generate;
  final GeocodeUseCase _geocode;
  final LocationService _location;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProPlanStarted event, Emitter<ProPlanState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final parking = await _getParking(NoParams());
    await parking.fold((f) async => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))), (p) async {
      final plan = await _getPlan(p.id);
      plan.fold((f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))), (view) {
        final corners = _cornersOf(view.plan);
        emit(
          state.copyWith(
            viewState: ViewState.success,
            parking: p,
            view: view,
            corners: corners,
            layout: view.plan.layout ?? state.layout,
            // The map opens on the drawn land, else on the parking itself (its address's position).
            center: corners.isNotEmpty
                ? centroidOf(corners)
                : (p.lat != null && p.lng != null ? LatLng(p.lat!, p.lng!) : state.center),
            step: corners.isNotEmpty ? (view.spots.isNotEmpty ? PlanStep.generate : PlanStep.draw) : PlanStep.locate,
          ),
        );
        if (corners.isNotEmpty) add(const _ProPlanEstimateRequested());
      });
    });
  }

  /// The saved outline's ring, without its closing point.
  static List<LatLng> _cornersOf(ParkingPlanModel plan) {
    final coords = plan.outline?['coordinates'];
    if (coords is! List || coords.isEmpty || coords.first is! List) return const [];
    final ring = (coords.first as List).map((p) => LatLng((p[1] as num).toDouble(), (p[0] as num).toDouble())).toList();
    if (ring.length > 1 && ring.first == ring.last) ring.removeLast();
    return ring;
  }

  Future<void> _onSearched(ProPlanAddressSearched event, Emitter<ProPlanState> emit) async {
    final q = event.query.trim();
    if (q.length < 3) return emit(state.copyWith(results: const []));
    emit(state.copyWith(searching: true, errorCode: null));
    final result = await _geocode(q);
    result.fold(
      (f) => emit(state.copyWith(searching: false, results: const [], errorCode: _code(f))),
      (list) => emit(state.copyWith(searching: false, results: list)),
    );
  }

  Future<void> _onGeolocate(ProPlanGeolocateRequested event, Emitter<ProPlanState> emit) async {
    emit(state.copyWith(locationProblem: null, searching: true));
    final access = await _location.requestAccess();
    if (access != LocationAccess.granted) return emit(state.copyWith(searching: false, locationProblem: access));
    final position = await _location.current();
    emit(state.copyWith(searching: false, center: position == null ? state.center : LatLng(position.lat, position.lng), results: const []));
  }

  Future<void> _onValidated(ProPlanOutlineValidated event, Emitter<ProPlanState> emit) async {
    final parking = state.parking;
    if (parking == null || !state.canValidate) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final ring = [...state.corners, state.corners.first].map((p) => [p.longitude, p.latitude]).toList();
    final saved = await _saveOutline(SaveOutlineParams(parkingId: parking.id, ring: ring));
    await saved.fold((f) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))), (view) async {
      emit(state.copyWith(view: view, step: PlanStep.generate, estimate: null, generated: false));
      await _onEstimate(const _ProPlanEstimateRequested(), emit);
    });
  }

  Future<void> _onEstimate(_ProPlanEstimateRequested event, Emitter<ProPlanState> emit) async {
    final parking = state.parking;
    if (parking == null) return;
    emit(state.copyWith(actionState: ViewState.processing));
    final result = await _estimate(parking.id);
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (estimate) => emit(state.copyWith(actionState: ViewState.success, estimate: estimate)),
    );
  }

  Future<void> _onGenerate(ProPlanGenerateRequested event, Emitter<ProPlanState> emit) async {
    final parking = state.parking;
    if (parking == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final result = await _generate(GeneratePlanParams(parkingId: parking.id, layout: state.layout));
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (view) => emit(
        state.copyWith(
          actionState: ViewState.success,
          view: view,
          generated: true,
          parking: parking.copyWith(totalCapacity: view.totalCapacity),
        ),
      ),
    );
  }
}

class _ProPlanEstimateRequested extends ProPlanEvent {
  const _ProPlanEstimateRequested();
}

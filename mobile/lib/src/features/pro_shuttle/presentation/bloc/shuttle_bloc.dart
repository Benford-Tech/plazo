// ignore_for_file: prefer_initializing_formals
import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/clock.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../../domain/usecases/shuttle_use_cases.dart';

part 'shuttle_bloc.freezed.dart';
part 'shuttle_event.dart';
part 'shuttle_state.dart';

/// Driver mode (R4): today's returns to pick up (or, T-A, the arrived travellers to drop off at the
/// terminal), the trip in progress.
///
/// - "Démarrer le trajet": the location permission is asked then; the position is sent at most
///   every 10 s (the server's rule) to the API, which shows it to the trip's passengers only, with
///   the foreground notification "Trajet navette en cours — position partagée avec vos clients".
/// - "Clients récupérés": the tracking stops at once, the API erases the position. The trip also
///   ends by itself 90 minutes after the start (the server erases it; the phone stops too).
/// - Positions live in memory only.
class ShuttleBloc extends Bloc<ShuttleEvent, ShuttleState> {
  ShuttleBloc(
    this._pickups,
    this._departures,
    this._vehicles,
    this._stops,
    this._current,
    this._start,
    this._send,
    this._end,
    this._location, {
    this.staying,
    Clock clock = systemClock,
    Duration pollInterval = const Duration(seconds: 12),
    Duration tickInterval = const Duration(seconds: 1),
    bool autoPoll = true,
  }) : _clock = clock,
       _pollInterval = pollInterval,
       _tickInterval = tickInterval,
       _autoPoll = autoPoll,
       super(ShuttleState(now: clock())) {
    on<ShuttleStarted>(_onStarted);
    on<ShuttlePolled>(_onPolled);
    on<ShuttleBandChanged>((event, emit) => emit(state.copyWith(band: event.band)));
    on<ShuttleDirectionChanged>(_onDirectionChanged);
    on<ShuttleStopChanged>((event, emit) => emit(state.copyWith(stopId: state.running ? state.stopId : event.stopId)));
    on<ShuttlePassengerToggled>(_onToggled);
    on<ShuttleVehicleChosen>((event, emit) => emit(state.copyWith(vehicle: event.vehicle)));
    on<ShuttleWaveChosen>(_onWaveChosen);
    on<ShuttleStartRequested>(_onStartRequested);
    on<ShuttlePositionChanged>(_onPosition);
    on<ShuttleEndRequested>(_onEndRequested);
    on<ShuttleTicked>(_onTicked);
    on<ShuttleTrackingFailed>(_onTrackingFailed);
    on<ShuttleErrorDismissed>((event, emit) => emit(state.copyWith(errorCode: null, endedNotice: false)));
  }

  final GetPickupsUseCase _pickups;
  final GetDeparturesUseCase _departures;

  /// F-A: the third band; absent in the tests that only drive a trip.
  final GetStayingUseCase? staying;
  final GetVehiclesUseCase _vehicles;
  final GetStopsUseCase _stops;
  final GetCurrentTripUseCase _current;
  final StartTripUseCase _start;
  final SendTripPositionUseCase _send;
  final EndTripUseCase _end;
  final LocationService _location;
  final Clock _clock;
  final Duration _pollInterval;
  final Duration _tickInterval;
  final bool _autoPoll;

  Timer? _poll;
  Timer? _ticker;
  StreamSubscription<GeoPosition>? _positions;
  GeoPosition? _pending;
  DateTime? _lastSentAt;
  bool _sending = false;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ShuttleStarted event, Emitter<ShuttleState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, now: _clock()));
    final current = await _current(NoParams());
    final trip = current.fold((_) => null, (t) => t);
    final vehicles = (await _vehicles(NoParams())).fold((_) => const <ShuttleVehicleModel>[], (v) => v);
    final stops = (await _stops(NoParams())).fold((_) => const <ShuttleStopModel>[], (s) => s);
    // The vehicle taken for the day (V-A), else the driver's usual one (in service), is preselected.
    final today = event.vehicleId == null ? null : vehicles.where((v) => v.inService && v.id == event.vehicleId).firstOrNull;
    final mine = today ?? (event.staffId == null ? null : vehicles.where((v) => v.inService && v.driverId == event.staffId).firstOrNull);
    emit(
      state.copyWith(
        trip: trip,
        vehicles: vehicles,
        stops: stops,
        vehicle: state.vehicle ?? (mine == null ? null : TripVehicleChoice(vehicleId: mine.id)),
        // Back in the app while a drop-off runs: stay on that side, on the "En route" band.
        direction: trip != null && trip.running ? trip.direction : (event.direction ?? state.direction),
        band: trip != null && trip.running ? 1 : 0,
      ),
    );
    await _loadPickups(emit, initial: true);
    // Opened from a booking's sheet: that traveller is selected when the list offers them.
    final wanted = event.reservationId;
    if (wanted != null && !state.running) {
      final offered = state.direction == 'dropoff'
          ? (state.departures?.rows ?? const []).where((r) => r.tripId == null).map((r) => r.reservationId)
          : (state.pickups?.rows ?? const []).where((r) => r.tripId == null).map((r) => r.reservationId);
      if (offered.contains(wanted)) emit(state.copyWith(selected: {wanted}));
    }
    // Back in the app while a trip runs: carry on sharing.
    if (trip != null && trip.running && !state.tracking) await _resumeTracking(emit);
    if (_autoPoll) {
      _poll ??= Timer.periodic(_pollInterval, (_) => add(const ShuttlePolled()));
      _ticker ??= Timer.periodic(_tickInterval, (_) => add(const ShuttleTicked()));
    }
  }

  Future<void> _onPolled(ShuttlePolled event, Emitter<ShuttleState> emit) => _loadPickups(emit, initial: false);

  /// Switching sides clears the selection and loads that side's list (no trip running).
  Future<void> _onDirectionChanged(ShuttleDirectionChanged event, Emitter<ShuttleState> emit) async {
    if (state.running || event.direction == state.direction) return;
    emit(state.copyWith(direction: event.direction, selected: const {}, errorCode: null, actionState: ViewState.idle));
    await _loadPickups(emit, initial: !state.loaded);
  }

  /// A wave taken over: switch to its side and stop, then select the travellers the list offers.
  Future<void> _onWaveChosen(ShuttleWaveChosen event, Emitter<ShuttleState> emit) async {
    if (state.running) return;
    emit(state.copyWith(direction: event.direction, stopId: event.stopId, selected: const {}, errorCode: null, actionState: ViewState.idle));
    await _loadPickups(emit, initial: !state.loaded);
    final offered = state.direction == 'dropoff'
        ? (state.departures?.rows ?? const []).where((r) => r.tripId == null).map((r) => r.reservationId)
        : (state.pickups?.rows ?? const []).where((r) => r.tripId == null).map((r) => r.reservationId);
    emit(state.copyWith(selected: event.reservationIds.where(offered.toSet().contains).toSet()));
  }

  /// Loads the list of the current direction: the returns to pick up, or the arrivals to drop off,
  /// and (F-A) the travellers away or back today.
  Future<void> _loadPickups(Emitter<ShuttleState> emit, {required bool initial}) async {
    final direction = state.direction;
    final away = staying;
    if (away != null) (await away(NoParams())).fold((_) {}, (data) => emit(state.copyWith(staying: data)));
    if (direction == 'dropoff') {
      final result = await _departures(NoParams());
      result.fold(
        (failure) => emit(state.copyWith(viewState: initial ? ViewState.error : state.viewState, errorCode: initial ? _code(failure) : state.errorCode, now: _clock())),
        (departures) {
          final ids = departures.rows.map((r) => r.reservationId).toSet();
          emit(state.copyWith(viewState: ViewState.success, departures: departures, selected: state.selected.where(ids.contains).toSet(), now: _clock()));
        },
      );
      return;
    }
    final result = await _pickups(NoParams());
    result.fold(
      (failure) => emit(state.copyWith(viewState: initial ? ViewState.error : state.viewState, errorCode: initial ? _code(failure) : state.errorCode, now: _clock())),
      (pickups) {
        // Travellers who left the list (handed back) leave the selection too.
        final ids = pickups.rows.map((r) => r.reservationId).toSet();
        emit(state.copyWith(viewState: ViewState.success, pickups: pickups, selected: state.selected.where(ids.contains).toSet(), now: _clock()));
      },
    );
  }

  void _onToggled(ShuttlePassengerToggled event, Emitter<ShuttleState> emit) {
    if (state.trip?.running ?? false) return;
    final selected = {...state.selected};
    if (!selected.remove(event.reservationId)) selected.add(event.reservationId);
    emit(state.copyWith(selected: selected));
  }

  Future<void> _onStartRequested(ShuttleStartRequested event, Emitter<ShuttleState> emit) async {
    if (state.selected.isEmpty || (state.trip?.running ?? false)) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, locationProblem: null, endedNotice: false));
    // The vehicle on file must seat everyone (the server checks too).
    final chosen = state.vehicle?.vehicleId == null ? null : state.vehicles.where((v) => v.id == state.vehicle!.vehicleId).firstOrNull;
    if (chosen != null && !chosen.inService) {
      emit(state.copyWith(actionState: ViewState.error, errorCode: 'vehicle_out_of_service'));
      return;
    }
    if (chosen?.seats != null && state.selectedPassengers > chosen!.seats!) {
      emit(state.copyWith(actionState: ViewState.error, errorCode: 'too_many_passengers'));
      return;
    }
    // No position, no trip: the whole point is to share it with the travellers.
    final access = await _location.requestAccess();
    if (access != LocationAccess.granted) {
      emit(state.copyWith(actionState: ViewState.idle, locationProblem: access));
      return;
    }
    final result = await _start(
      StartTripParams(reservationIds: state.selected.toList(), vehicle: state.vehicle ?? const TripVehicleChoice(), direction: state.direction, stopId: state.stopId),
    );
    await result.fold((failure) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))), (trip) async {
      _lastSentAt = null;
      _startTracking();
      emit(state.copyWith(actionState: ViewState.success, trip: trip, tracking: true, selected: const {}, band: 1));
      await _loadPickups(emit, initial: false);
    });
  }

  Future<void> _onPosition(ShuttlePositionChanged event, Emitter<ShuttleState> emit) async {
    if (!state.tracking) return;
    _pending = event.position;
    emit(state.copyWith(lastPosition: event.position));
    await _flush(emit);
  }

  /// Sends the newest pending position, once 10 s passed since the previous one.
  Future<void> _flush(Emitter<ShuttleState> emit) async {
    final trip = state.trip;
    final pending = _pending;
    if (trip == null || pending == null || _sending || !state.tracking) return;
    final now = _clock();
    if (_lastSentAt != null && now.difference(_lastSentAt!) < const Duration(seconds: 10)) return;
    _sending = true;
    _pending = null;
    _lastSentAt = now;
    final result = await _send(TripPositionParams(tripId: trip.id, position: pending));
    _sending = false;
    result.fold((failure) {
      if (failure.code == 'trip_not_running' || failure.statusCode == 404) {
        // Ended elsewhere (90 minutes, a manager): stop here too.
        _stopTracking();
        emit(state.copyWith(tracking: false, lastPosition: null, trip: null, endedNotice: true));
        return;
      }
      // Too soon or offline: the newest position waits for the next try. A stale one is dropped (a newer fix will come).
      if (failure.code != 'position_too_old' && failure.code != 'invalid_recorded_at') _pending ??= pending;
    }, (updated) => emit(state.copyWith(trip: updated)));
  }

  Future<void> _onEndRequested(ShuttleEndRequested event, Emitter<ShuttleState> emit) async {
    final trip = state.trip;
    if (trip == null) return;
    // Local first: no position leaves the phone from now on.
    _stopTracking();
    emit(state.copyWith(actionState: ViewState.processing, tracking: false, lastPosition: null, errorCode: null));
    final result = await _end(trip.id);
    await result.fold((failure) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))), (_) async {
      emit(state.copyWith(actionState: ViewState.success, trip: null, endedNotice: true, band: 0));
      await _loadPickups(emit, initial: false);
    });
  }

  Future<void> _onTicked(ShuttleTicked event, Emitter<ShuttleState> emit) async {
    final now = _clock();
    emit(state.copyWith(now: now));
    final trip = state.trip;
    if (trip != null && trip.running && !now.isBefore(trip.expiresAt)) {
      // The 90 minutes are over: the server erased the position; stop here at once.
      _stopTracking();
      emit(state.copyWith(tracking: false, lastPosition: null, trip: null, endedNotice: true, band: 0));
      return;
    }
    await _flush(emit);
  }

  void _onTrackingFailed(ShuttleTrackingFailed event, Emitter<ShuttleState> emit) {
    _stopTracking();
    emit(state.copyWith(tracking: false, locationProblem: LocationAccess.denied));
  }

  Future<void> _resumeTracking(Emitter<ShuttleState> emit) async {
    final access = await _location.requestAccess();
    if (access == LocationAccess.granted) {
      _startTracking();
      emit(state.copyWith(tracking: true));
    } else {
      emit(state.copyWith(locationProblem: access));
    }
  }

  void _startTracking() {
    unawaited(_positions?.cancel());
    _pending = null;
    _positions = _location
        .positions(background: true, notice: LocationNotice.driver)
        .listen((position) => add(ShuttlePositionChanged(position)), onError: (Object _) => add(const ShuttleTrackingFailed()));
  }

  void _stopTracking() {
    unawaited(_positions?.cancel());
    _positions = null;
    _pending = null;
  }

  @override
  Future<void> close() async {
    _poll?.cancel();
    _ticker?.cancel();
    await _positions?.cancel();
    return super.close();
  }
}

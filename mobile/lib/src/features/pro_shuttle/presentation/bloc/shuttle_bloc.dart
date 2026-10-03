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

/// Driver mode (R4): today's returns to pick up, the trip in progress.
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
    this._vehicles,
    this._current,
    this._start,
    this._send,
    this._end,
    this._location, {
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
    on<ShuttlePassengerToggled>(_onToggled);
    on<ShuttleVehicleChosen>((event, emit) => emit(state.copyWith(vehicle: event.vehicle)));
    on<ShuttleStartRequested>(_onStartRequested);
    on<ShuttlePositionChanged>(_onPosition);
    on<ShuttleEndRequested>(_onEndRequested);
    on<ShuttleTicked>(_onTicked);
    on<ShuttleTrackingFailed>(_onTrackingFailed);
    on<ShuttleErrorDismissed>((event, emit) => emit(state.copyWith(errorCode: null, endedNotice: false)));
  }

  final GetPickupsUseCase _pickups;
  final GetVehiclesUseCase _vehicles;
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
    final vehicles = await _vehicles(NoParams());
    emit(state.copyWith(trip: trip, vehicles: vehicles.fold((_) => const [], (v) => v)));
    await _loadPickups(emit, initial: true);
    // Back in the app while a trip runs: carry on sharing.
    if (trip != null && trip.running && !state.tracking) await _resumeTracking(emit);
    if (_autoPoll) {
      _poll ??= Timer.periodic(_pollInterval, (_) => add(const ShuttlePolled()));
      _ticker ??= Timer.periodic(_tickInterval, (_) => add(const ShuttleTicked()));
    }
  }

  Future<void> _onPolled(ShuttlePolled event, Emitter<ShuttleState> emit) => _loadPickups(emit, initial: false);

  Future<void> _loadPickups(Emitter<ShuttleState> emit, {required bool initial}) async {
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
    // No position, no trip: the whole point is to share it with the travellers.
    final access = await _location.requestAccess();
    if (access != LocationAccess.granted) {
      emit(state.copyWith(actionState: ViewState.idle, locationProblem: access));
      return;
    }
    final result = await _start(StartTripParams(reservationIds: state.selected.toList(), vehicle: state.vehicle ?? const TripVehicleChoice()));
    await result.fold((failure) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))), (trip) async {
      _lastSentAt = null;
      _startTracking();
      emit(state.copyWith(actionState: ViewState.success, trip: trip, tracking: true, selected: const {}));
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
      _pending ??= pending;
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
      emit(state.copyWith(actionState: ViewState.success, trip: null, endedNotice: true));
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
      emit(state.copyWith(tracking: false, lastPosition: null, trip: null, endedNotice: true));
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

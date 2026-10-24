// ignore_for_file: prefer_initializing_formals
import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/clock.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../../../shared/child_seats/child_seats.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../../domain/usecases/shuttle_use_cases.dart';
import 'shuttle_boarding.dart';

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
    ShuttleBoardingRequests? boarding,
    Clock clock = systemClock,
    Duration pollInterval = const Duration(seconds: 12),
    Duration tickInterval = const Duration(seconds: 1),
    bool autoPoll = true,
  }) : _boarding = boarding,
       _clock = clock,
       _pollInterval = pollInterval,
       _tickInterval = tickInterval,
       _autoPoll = autoPoll,
       super(ShuttleState(now: clock())) {
    on<ShuttleStarted>(_onStarted);
    on<ShuttlePolled>(_onPolled);
    on<ShuttleBandChanged>((event, emit) => emit(state.copyWith(band: event.band)));
    on<ShuttleDirectionChanged>(_onDirectionChanged);
    on<ShuttleStopChanged>((event, emit) => emit(state.copyWith(stopId: state.running ? state.stopId : event.stopId)));
    on<ShuttleBoardRequested>((event, emit) => _board(event.boarding, emit));
    on<ShuttlePassengerToggled>(_onToggled);
    on<ShuttleSlotToggled>(_onSlotToggled);
    on<ShuttleVehicleChosen>((event, emit) => emit(state.copyWith(vehicle: event.vehicle)));
    on<ShuttleDayVehicleChanged>(_onDayVehicleChanged);
    on<ShuttleWaveChosen>(_onWaveChosen);
    on<ShuttleStartRequested>(_onStartRequested);
    on<ShuttlePositionChanged>(_onPosition);
    on<ShuttleEndRequested>(_onEndRequested);
    on<ShuttleTicked>(_onTicked);
    on<ShuttleTrackingFailed>(_onTrackingFailed);
    on<ShuttleErrorDismissed>((event, emit) => emit(state.copyWith(errorCode: null, unpinned: const [], endedNotice: false)));
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

  /// The planning's « Embarquer » / « Récupérer » (14/10/2026); absent in the tests that only drive a trip.
  final ShuttleBoardingRequests? _boarding;
  StreamSubscription<ShuttleBoarding>? _boardingRequests;
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
    // The vehicle taken for the day (V-A), else the driver's usual one (in service), is preselected; the one of the day
    // lets the trip start in one tap (14/10/2026).
    final today = event.vehicleId == null ? null : vehicles.where((v) => v.inService && v.id == event.vehicleId).firstOrNull;
    final mine = today ?? (event.staffId == null ? null : vehicles.where((v) => v.inService && v.driverId == event.staffId).firstOrNull);
    emit(
      state.copyWith(
        trip: trip,
        vehicles: vehicles,
        stops: stops,
        vehicle: state.vehicle ?? (mine == null ? null : TripVehicleChoice(vehicleId: mine.id)),
        dayVehicleId: today?.id,
        // Back in the app while a drop-off runs: stay on that side, on the "En route" band.
        direction: trip != null && trip.running ? trip.direction : (event.boarding?.direction ?? event.direction ?? state.direction),
        band: trip != null && trip.running ? 1 : 0,
      ),
    );
    await _loadPickups(emit, initial: true);
    // Opened from a booking's sheet: that traveller is selected when the list offers them.
    final wanted =
        event.boarding ?? (event.reservationId == null ? null : ShuttleBoarding.only(direction: state.direction, reservationId: event.reservationId!));
    if (wanted != null) await _board(wanted, emit);
    // The planning's requests from now on, and the one made before this list opened (the tab was not built yet).
    final boarding = _boarding;
    if (boarding != null) {
      _boardingRequests ??= boarding.stream.listen((b) => add(ShuttleBoardRequested(b)));
      final pending = boarding.take();
      if (pending != null) await _board(pending, emit);
    }
    // Back in the app while a trip runs: carry on sharing (when the parking shares its shuttles, R-B).
    if (trip != null && trip.running && trip.sharePosition && !state.tracking) await _resumeTracking(emit);
    if (_autoPoll) {
      _poll ??= Timer.periodic(_pollInterval, (_) => add(const ShuttlePolled()));
      _ticker ??= Timer.periodic(_tickInterval, (_) => add(const ShuttleTicked()));
    }
  }

  Future<void> _onPolled(ShuttlePolled event, Emitter<ShuttleState> emit) => _loadPickups(emit, initial: false);

  /// A new vehicle of the day is preselected and starts the trips in one tap; given back, the sheet comes back.
  void _onDayVehicleChanged(ShuttleDayVehicleChanged event, Emitter<ShuttleState> emit) {
    final today = event.vehicleId == null ? null : state.vehicles.where((v) => v.inService && v.id == event.vehicleId).firstOrNull;
    if (today?.id == state.dayVehicleId) return;
    emit(
      state.copyWith(
        dayVehicleId: today?.id,
        vehicle: today == null ? state.vehicle : TripVehicleChoice(vehicleId: today.id),
      ),
    );
  }

  /// Switching sides clears the selection (and the rows pinned from the planning) and loads that side's list.
  Future<void> _onDirectionChanged(ShuttleDirectionChanged event, Emitter<ShuttleState> emit) async {
    if (state.running || event.direction == state.direction) return;
    emit(
      state.copyWith(
        direction: event.direction,
        selected: const {},
        pinnedDepartures: const [],
        pinnedPickups: const [],
        errorCode: null,
        unpinned: const [],
        actionState: ViewState.idle,
      ),
    );
    await _loadPickups(emit, initial: !state.loaded);
  }

  /// A wave taken over: switch to its side and stop, then select the travellers the list offers.
  Future<void> _onWaveChosen(ShuttleWaveChosen event, Emitter<ShuttleState> emit) async {
    if (state.running) return;
    emit(
      state.copyWith(
        direction: event.direction,
        stopId: event.stopId,
        selected: const {},
        pinnedDepartures: const [],
        pinnedPickups: const [],
        errorCode: null,
        unpinned: const [],
        actionState: ViewState.idle,
      ),
    );
    await _loadPickups(emit, initial: !state.loaded);
    final offered = _boardable();
    emit(state.copyWith(selected: event.reservationIds.where(offered.contains).toSet()));
  }

  /// « Embarquer » / « Récupérer » (14/10/2026): that side and the first band; the traveller is added to the selection
  /// (the rest kept on the same side), with the planning's row when the list does not hold them. One on another trip
  /// is not added: the server would refuse the whole trip.
  Future<void> _board(ShuttleBoarding boarding, Emitter<ShuttleState> emit) async {
    // A start (or an end) still in flight: its outcome first, so that it does not wipe this traveller from the selection.
    if (state.actionState.isProcessing) {
      try {
        await stream.firstWhere((s) => !s.actionState.isProcessing);
      } on StateError {
        return; // closed meanwhile
      }
      if (emit.isDone) return;
    }
    // The driver's own trip runs: no second one before it ends (the server would refuse it); said on « En route ».
    if (state.running) {
      emit(state.copyWith(band: 1, actionState: ViewState.error, errorCode: 'trip_already_running', unpinned: const []));
      return;
    }
    if (boarding.direction != state.direction) {
      emit(
        state.copyWith(
          direction: boarding.direction,
          selected: const {},
          pinnedDepartures: const [],
          pinnedPickups: const [],
          errorCode: null,
          unpinned: const [],
          actionState: ViewState.idle,
        ),
      );
      await _loadPickups(emit, initial: !state.loaded);
    }
    final id = boarding.reservationId;
    final dropoff = boarding.direction == 'dropoff';
    // The trip of each listed row of this traveller (none listed: empty).
    final trips = dropoff
        ? [
            for (final r in state.departureRows)
              if (r.reservationId == id) r.tripId,
          ]
        : [
            for (final r in state.pickupRows)
              if (r.reservationId == id) r.tripId,
          ];
    // The planning knows the traveller's stop by its id only: its name groups the row under that stop.
    final departure = boarding.departure;
    final pickup = boarding.pickup;
    if (trips.isEmpty && dropoff && departure != null) {
      emit(
        state.copyWith(
          pinnedDepartures: [
            ...state.pinnedDepartures,
            departure.copyWith(stopName: departure.stopName ?? _stopName(departure.stopId)),
          ],
        ),
      );
    }
    if (trips.isEmpty && !dropoff && pickup != null) {
      emit(
        state.copyWith(
          pinnedPickups: [
            ...state.pinnedPickups,
            pickup.copyWith(stopName: pickup.stopName ?? _stopName(pickup.stopId)),
          ],
        ),
      );
    }
    if (_boardable().contains(id)) {
      emit(state.copyWith(band: 0, selected: {...state.selected, id}, errorCode: null, unpinned: const [], actionState: ViewState.idle));
    } else if (trips.any((t) => t != null)) {
      emit(state.copyWith(band: 0, actionState: ViewState.error, errorCode: 'already_on_trip', unpinned: const []));
    } else {
      emit(state.copyWith(band: 0));
    }
  }

  /// The name of one of the parking's stops (null: the airport, or a stop the list does not know).
  String? _stopName(String? stopId) => stopId == null ? null : state.stops.where((s) => !s.builtIn && s.id == stopId).firstOrNull?.name;

  /// The travellers the current list lets board a trip: not on another trip; to the terminal, the expected ones too
  /// (14/10/2026: the server checks them in when the trip starts).
  Set<String> _boardable() =>
      state.direction == 'dropoff' ? state.selectableDepartures.map((r) => r.reservationId).toSet() : state.selectable.map((r) => r.reservationId).toSet();

  /// Tells the planning who rides a running trip (« Embarquer » is not offered for them), as far as the lists know, and
  /// whether the driver's own trip runs (not offered at all).
  void _shareTrips() {
    final boarding = _boarding;
    if (boarding == null) return;
    final trip = state.trip;
    boarding.tripsChanged({
      if (trip != null && trip.running) ...trip.passengers.map((p) => p.reservationId),
      ...?state.departures?.rows.where((r) => r.tripId != null).map((r) => r.reservationId),
      ...?state.pickups?.rows.where((r) => r.tripId != null).map((r) => r.reservationId),
    }, running: state.running);
  }

  /// Loads the list of the current direction: the returns to pick up, or the arrivals to drop off,
  /// and (F-A) the travellers away or back today.
  Future<void> _loadPickups(Emitter<ShuttleState> emit, {required bool initial}) async {
    final direction = state.direction;
    if (direction == 'dropoff') {
      final result = await _departures(NoParams());
      // The driver switched sides meanwhile: this answer would sort the other side's selection.
      if (state.direction != direction) return;
      result.fold(
        (failure) =>
            emit(state.copyWith(viewState: initial ? ViewState.error : state.viewState, errorCode: initial ? _code(failure) : state.errorCode, now: _clock())),
        (departures) {
          final ids = departures.rows.map((r) => r.reservationId).toSet();
          // A row pinned from the planning gives way to the list's own once it holds the traveller.
          final pinned = state.pinnedDepartures.where((r) => !ids.contains(r.reservationId)).toList();
          ids.addAll(pinned.map((r) => r.reservationId));
          emit(
            state.copyWith(
              viewState: ViewState.success,
              departures: departures,
              pinnedDepartures: pinned,
              selected: state.selected.where(ids.contains).toSet(),
              now: _clock(),
            ),
          );
        },
      );
      _shareTrips();
      await _loadOtherSide(emit, direction);
      return;
    }
    final result = await _pickups(NoParams());
    if (state.direction != direction) return;
    result.fold(
      (failure) =>
          emit(state.copyWith(viewState: initial ? ViewState.error : state.viewState, errorCode: initial ? _code(failure) : state.errorCode, now: _clock())),
      (pickups) {
        // Travellers who left the list (handed back) leave the selection too.
        final ids = pickups.rows.map((r) => r.reservationId).toSet();
        final pinned = state.pinnedPickups.where((r) => !ids.contains(r.reservationId)).toList();
        ids.addAll(pinned.map((r) => r.reservationId));
        emit(
          state.copyWith(
            viewState: ViewState.success,
            pickups: pickups,
            pinnedPickups: pinned,
            selected: state.selected.where(ids.contains).toSet(),
            now: _clock(),
          ),
        );
      },
    );
    _shareTrips();
    await _loadOtherSide(emit, direction);
  }

  /// B (22/10/2026): the other side's list too, for its tab's count (« Aller · 5 », « Retour · 4 »); a failure keeps
  /// the count it had.
  Future<void> _loadOtherSide(Emitter<ShuttleState> emit, String shown) async {
    if (shown == 'dropoff') {
      final result = await _pickups(NoParams());
      if (state.direction != shown || emit.isDone) return;
      result.fold((_) {}, (pickups) => emit(state.copyWith(pickups: pickups)));
    } else {
      final result = await _departures(NoParams());
      if (state.direction != shown || emit.isDone) return;
      result.fold((_) {}, (departures) => emit(state.copyWith(departures: departures)));
    }
  }

  void _onToggled(ShuttlePassengerToggled event, Emitter<ShuttleState> emit) {
    if (state.trip?.running ?? false) return;
    final selected = {...state.selected};
    if (!selected.remove(event.reservationId)) {
      selected.add(event.reservationId);
      emit(state.copyWith(selected: selected));
      return;
    }
    // A row pinned from the planning leaves with its tick.
    emit(
      state.copyWith(
        selected: selected,
        pinnedDepartures: state.pinnedDepartures.where((r) => r.reservationId != event.reservationId).toList(),
        pinnedPickups: state.pinnedPickups.where((r) => r.reservationId != event.reservationId).toList(),
      ),
    );
  }

  /// A whole slot ticked (the ones that can board), or unticked when all of them already are.
  void _onSlotToggled(ShuttleSlotToggled event, Emitter<ShuttleState> emit) {
    if (state.running) return;
    final boardable = _boardable();
    final ids = event.reservationIds.where(boardable.contains).toSet();
    if (ids.isEmpty) return;
    final all = ids.every(state.selected.contains);
    emit(state.copyWith(selected: all ? state.selected.difference(ids) : {...state.selected, ...ids}));
  }

  Future<void> _onStartRequested(ShuttleStartRequested event, Emitter<ShuttleState> emit) async {
    if (state.trip?.running ?? false) return;
    // Only travellers who can board: one taken by another trip since would make the server refuse all.
    final boardable = _boardable();
    if (!state.selected.every(boardable.contains)) emit(state.copyWith(selected: state.selected.where(boardable.contains).toSet()));
    if (state.selected.isEmpty) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, unpinned: const [], locationProblem: null, endedNotice: false));
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
    // No position, no trip: the whole point is to share it — unless the parking turned the tracking off (R-B).
    if (state.sharePosition) {
      final access = await _location.requestAccess();
      if (access != LocationAccess.granted) {
        emit(state.copyWith(actionState: ViewState.idle, locationProblem: access));
        return;
      }
    }
    final result = await _start(
      StartTripParams(
        reservationIds: state.selected.toList(),
        vehicle: state.vehicle ?? const TripVehicleChoice(),
        direction: state.direction,
        // 22/10/2026: where the ticked travellers go (their bookings' stop), not a stop the driver picks.
        stopId: state.selectedStopId,
      ),
    );
    await result.fold(
      (failure) async {
        final code = _code(failure);
        emit(state.copyWith(actionState: ViewState.error, errorCode: code));
        // One of the travellers cannot board (cancelled, gone, on another trip): find which, or the next tap fails too.
        if (code == 'invalid_passengers' || code == 'already_on_trip') await _dropStalePins(emit);
      },
      (trip) async {
        _lastSentAt = null;
        if (trip.sharePosition) _startTracking();
        emit(
          state.copyWith(
            actionState: ViewState.success,
            trip: trip,
            tracking: trip.sharePosition,
            selected: const {},
            pinnedDepartures: const [],
            pinnedPickups: const [],
            band: 1,
          ),
        );
        _shareTrips();
        await _loadPickups(emit, initial: false);
      },
    );
  }

  /// A start refused for one of the travellers: the list read again drops the cancelled ones and marks the ones on
  /// another trip. When it explains nothing, the rows added by hand (planning, booking's sheet), which nothing reads
  /// again, are the suspects: they leave the selection (named under the error), so that the next tap starts with the
  /// others.
  Future<void> _dropStalePins(Emitter<ShuttleState> emit) async {
    final before = state.selected;
    await _loadPickups(emit, initial: false);
    final boardable = _boardable();
    if (state.selected.length < before.length || !state.selected.every(boardable.contains)) return;
    final names = <String, String>{
      for (final r in state.pinnedDepartures)
        if (state.selected.contains(r.reservationId)) r.reservationId: r.customerName,
      for (final r in state.pinnedPickups)
        if (state.selected.contains(r.reservationId)) r.reservationId: r.customerName,
    };
    if (names.isEmpty) return;
    emit(
      state.copyWith(
        selected: state.selected.difference(names.keys.toSet()),
        pinnedDepartures: state.pinnedDepartures.where((r) => !names.containsKey(r.reservationId)).toList(),
        pinnedPickups: state.pinnedPickups.where((r) => !names.containsKey(r.reservationId)).toList(),
        unpinned: names.values.toList(),
      ),
    );
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
        _shareTrips();
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
      _shareTrips();
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
      _shareTrips();
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
    await _boardingRequests?.cancel();
    await _positions?.cancel();
    return super.close();
  }
}

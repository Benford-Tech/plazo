import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/clock.dart';
import '../../../../services/location_service.dart';
import '../../data/models/arrival_model.dart';
import '../../domain/usecases/announce_arrival_use_case.dart';
import '../../domain/usecases/at_meeting_point_use_case.dart';
import '../../domain/usecases/get_arrival_use_case.dart';
import '../../domain/usecases/send_position_use_case.dart';
import '../../domain/usecases/start_sharing_use_case.dart';
import '../../domain/usecases/stop_sharing_use_case.dart';

part 'arrival_bloc.freezed.dart';
part 'arrival_event.dart';
part 'arrival_state.dart';

/// "Prévenir de son arrivée", traveller side.
///
/// - Nothing is shared without consent: the location permission is only asked once the traveller
///   taps "Je suis en route — partager ma position".
/// - While sharing, the latest position is sent at most every 10 s (the server's rule); positions
///   in between replace each other and only the newest goes out.
/// - Sharing stops by itself when the server says the traveller reached the meeting point (150 m),
///   when it ended (2 h, stopped elsewhere), or when the local 2-hour timer runs out.
/// - Positions live in memory only (the last one draws the map); nothing is stored on the phone.
class ArrivalBloc extends Bloc<ArrivalEvent, ArrivalState> {
  ArrivalBloc(
    this._get,
    this._start,
    this._send,
    this._announce,
    this._atMeetingPoint,
    this._stop,
    this._location, {
    Clock clock = systemClock,
    this._tickInterval = const Duration(seconds: 1),
    this._autoTick = true,
  }) : _clock = clock,
       super(ArrivalState(now: clock())) {
    on<ArrivalOpened>(_onOpened);
    on<ArrivalRefreshRequested>(_onRefresh);
    on<ArrivalShareRequested>(_onShare);
    on<ArrivalPositionChanged>(_onPosition);
    on<ArrivalAnnounceToggled>((event, emit) => emit(state.copyWith(showAnnounceOptions: !state.showAnnounceOptions)));
    on<ArrivalAnnounced>(_onAnnounced);
    on<ArrivalAtMeetingPointRequested>(_onAtMeetingPoint);
    on<ArrivalStopRequested>(_onStop);
    on<ArrivalTicked>(_onTick);
    on<ArrivalTrackingFailed>(_onTrackingFailed);
  }

  final GetArrivalUseCase _get;
  final StartSharingUseCase _start;
  final SendPositionUseCase _send;
  final AnnounceArrivalUseCase _announce;
  final AtMeetingPointUseCase _atMeetingPoint;
  final StopSharingUseCase _stop;
  final LocationService _location;
  final Clock _clock;
  final Duration _tickInterval;
  final bool _autoTick;

  StreamSubscription<GeoPosition>? _positions;
  Timer? _ticker;
  GeoPosition? _pending;
  DateTime? _lastSentAt;
  bool _sending = false;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onOpened(ArrivalOpened event, Emitter<ArrivalState> emit) async {
    emit(state.copyWith(reference: event.reference.toUpperCase(), loadState: ViewState.processing, now: _clock()));
    final result = await _get(event.reference);
    await result.fold(
      (failure) async => emit(state.copyWith(loadState: ViewState.error, errorCode: _code(failure))),
      (arrival) async {
        emit(state.copyWith(loadState: ViewState.success, arrival: arrival));
        if (_autoTick) _ticker ??= Timer.periodic(_tickInterval, (_) => add(const ArrivalTicked()));
        // Back in the app while a sharing (already consented to) is live: carry on.
        if (arrival.isSharing && !state.tracking) {
          final access = await _location.requestAccess();
          if (access == LocationAccess.granted) {
            _startTracking();
            emit(state.copyWith(tracking: true));
          }
        }
      },
    );
  }

  Future<void> _onRefresh(ArrivalRefreshRequested event, Emitter<ArrivalState> emit) async {
    final reference = state.reference;
    if (reference == null) return;
    final result = await _get(reference);
    result.fold((failure) => emit(state.copyWith(errorCode: _code(failure))), (arrival) => _apply(arrival, emit));
  }

  Future<void> _onShare(ArrivalShareRequested event, Emitter<ArrivalState> emit) async {
    final reference = state.reference;
    final kind = state.openKind;
    if (reference == null || kind == null) return;
    // No consent, no permission prompt and no call.
    if (!event.consent) {
      emit(state.copyWith(errorCode: 'consent_required'));
      return;
    }
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, locationProblem: null));
    final access = await _location.requestAccess();
    if (access != LocationAccess.granted) {
      emit(state.copyWith(actionState: ViewState.idle, locationProblem: access));
      return;
    }
    final result = await _start(StartSharingParams(reference: reference, kind: kind));
    result.fold(
      (failure) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))),
      (arrival) {
        _lastSentAt = null;
        _startTracking();
        emit(state.copyWith(actionState: ViewState.success, arrival: arrival, tracking: true, showAnnounceOptions: false));
        if (_autoTick) _ticker ??= Timer.periodic(_tickInterval, (_) => add(const ArrivalTicked()));
      },
    );
  }

  Future<void> _onPosition(ArrivalPositionChanged event, Emitter<ArrivalState> emit) async {
    if (!state.tracking) return;
    _pending = event.position;
    emit(state.copyWith(lastPosition: event.position));
    await _flush(emit);
  }

  /// Sends the newest pending position, once the interval since the previous one has passed.
  Future<void> _flush(Emitter<ArrivalState> emit) async {
    final reference = state.reference;
    final pending = _pending;
    if (reference == null || pending == null || _sending || !state.tracking) return;
    final now = _clock();
    final interval = Duration(seconds: state.arrival?.rules.positionIntervalSeconds ?? 10);
    if (_lastSentAt != null && now.difference(_lastSentAt!) < interval) return;
    _sending = true;
    _pending = null;
    _lastSentAt = now;
    final result = await _send(SendPositionParams(reference: reference, position: pending));
    _sending = false;
    result.fold((failure) {
      if (failure.code == 'not_sharing') {
        _stopTracking();
        emit(state.copyWith(tracking: false));
        add(const ArrivalRefreshRequested());
        return;
      }
      // Too soon or offline: the newest position waits for the next try. A stale one is dropped (a newer fix will come).
      if (failure.code != 'position_too_old' && failure.code != 'invalid_recorded_at') _pending ??= pending;
    }, (arrival) => _apply(arrival, emit));
  }

  Future<void> _onAnnounced(ArrivalAnnounced event, Emitter<ArrivalState> emit) async {
    final reference = state.reference;
    final kind = state.openKind;
    if (reference == null || kind == null) return;
    _stopTracking();
    emit(state.copyWith(actionState: ViewState.processing, tracking: false, lastPosition: null, errorCode: null));
    final result = await _announce(AnnounceParams(reference: reference, kind: kind, minutes: event.minutes));
    result.fold(
      (failure) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))),
      (arrival) => emit(state.copyWith(actionState: ViewState.success, arrival: arrival, showAnnounceOptions: false)),
    );
  }

  Future<void> _onAtMeetingPoint(ArrivalAtMeetingPointRequested event, Emitter<ArrivalState> emit) async {
    final reference = state.reference;
    final kind = state.openKind;
    if (reference == null || kind == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, locationProblem: null));
    GeoPosition? position;
    if (event.withPosition) {
      final access = await _location.requestAccess();
      if (access == LocationAccess.granted) {
        position = await _location.current();
      } else {
        emit(state.copyWith(locationProblem: access));
      }
    }
    _stopTracking();
    final result = await _atMeetingPoint(AtMeetingPointParams(reference: reference, kind: kind, position: position));
    result.fold(
      (failure) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))),
      (arrival) => emit(state.copyWith(actionState: ViewState.success, arrival: arrival, tracking: false, lastPosition: null)),
    );
  }

  Future<void> _onStop(ArrivalStopRequested event, Emitter<ArrivalState> emit) async {
    final reference = state.reference;
    if (reference == null) return;
    // Local first: no position leaves the phone from now on.
    _stopTracking();
    emit(state.copyWith(actionState: ViewState.processing, tracking: false, lastPosition: null, errorCode: null));
    final result = await _stop(StopSharingParams(reference: reference, kind: state.arrival?.signal?.kind));
    result.fold(
      (failure) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(failure))),
      (arrival) => emit(state.copyWith(actionState: ViewState.success, arrival: arrival)),
    );
  }

  Future<void> _onTick(ArrivalTicked event, Emitter<ArrivalState> emit) async {
    final now = _clock();
    emit(state.copyWith(now: now));
    final signal = state.arrival?.signal;
    final live = signal != null && (signal.state == ArrivalSignalState.sharing || signal.state == ArrivalSignalState.announced);
    if (live && !now.isBefore(signal.expiresAt)) {
      // The 2 hours are over: stop here at once, the server erases the position on its side.
      if (state.tracking) {
        _stopTracking();
        emit(state.copyWith(tracking: false, lastPosition: null));
      }
      add(const ArrivalRefreshRequested());
      return;
    }
    await _flush(emit);
  }

  void _onTrackingFailed(ArrivalTrackingFailed event, Emitter<ArrivalState> emit) {
    _stopTracking();
    emit(state.copyWith(tracking: false, locationProblem: LocationAccess.denied));
  }

  /// A new server state: a sharing that is over stops the tracking.
  void _apply(ArrivalModel arrival, Emitter<ArrivalState> emit) {
    if (!arrival.isSharing && state.tracking) {
      _stopTracking();
      emit(state.copyWith(arrival: arrival, tracking: false, lastPosition: null));
      return;
    }
    emit(state.copyWith(arrival: arrival));
  }

  void _startTracking() {
    unawaited(_positions?.cancel());
    _pending = null;
    _positions = _location.positions(background: true).listen(
      (position) => add(ArrivalPositionChanged(position)),
      onError: (Object _) => add(const ArrivalTrackingFailed()),
    );
  }

  void _stopTracking() {
    unawaited(_positions?.cancel());
    _positions = null;
    _pending = null;
  }

  @override
  Future<void> close() async {
    _ticker?.cancel();
    await _positions?.cancel();
    return super.close();
  }
}

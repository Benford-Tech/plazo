import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/stay.dart';
import '../../../../core/utils/clock.dart';
import '../../../../core/utils/use_case.dart';
import '../../../booking/data/models/public_booking_model.dart';
import '../../../booking/domain/usecases/booking_actions_use_cases.dart';

part 'trips_bloc.freezed.dart';

sealed class TripsEvent {
  const TripsEvent();
}

/// Reads the bookings kept on this phone (tab opened, pull to refresh, a booking added).
class TripsLoaded extends TripsEvent {
  const TripsLoaded({this.quiet = false});
  final bool quiet;
}

/// A booking changed elsewhere (flight, cancellation, payment): replaced in the list.
class TripsBookingChanged extends TripsEvent {
  const TripsBookingChanged(this.booking);
  final PublicBookingModel booking;
}

@freezed
abstract class TripsState with _$TripsState {
  const TripsState._();

  const factory TripsState({
    @Default(ViewState.idle) ViewState loadState,
    @Default(<PublicBookingModel>[]) List<PublicBookingModel> bookings,
    String? errorMessage,
    required DateTime now,
  }) = _TripsState;

  String get _nowLocal => fromInstant(now);

  /// To come or in progress: not closed, and the return is not past. Soonest first.
  List<PublicBookingModel> get upcoming =>
      bookings.where((b) => b.active && b.returnAt.compareTo(_nowLocal) >= 0).toList()..sort((a, b) => a.arrivalAt.compareTo(b.arrivalAt));

  /// Closed or over. Latest first.
  List<PublicBookingModel> get past =>
      bookings.where((b) => !upcoming.contains(b)).toList()..sort((a, b) => b.arrivalAt.compareTo(a.arrivalAt));

  /// "Votre prochain départ" on the search tab: the next confirmed booking.
  PublicBookingModel? get nextDeparture => upcoming.where((b) => b.status != 'pending_payment').firstOrNull;
}

/// A5, "Mes réservations": the bookings kept on this phone (reference + manage token in the
/// secure storage, no traveller account), split into À venir / Passées. Shared with the search tab.
class TripsBloc extends Bloc<TripsEvent, TripsState> {
  TripsBloc(this._load, {Clock clock = systemClock}) : _clock = clock, super(TripsState(now: clock())) {
    on<TripsLoaded>(_onLoaded);
    on<TripsBookingChanged>(_onChanged);
  }

  final LoadSavedBookingsUseCase _load;
  final Clock _clock;

  Future<void> _onLoaded(TripsLoaded event, Emitter<TripsState> emit) async {
    if (!event.quiet) emit(state.copyWith(loadState: ViewState.processing, errorMessage: null));
    final result = await _load(NoParams());
    result.fold(
      (failure) => emit(state.copyWith(loadState: ViewState.error, errorMessage: failure.message, now: _clock())),
      (bookings) => emit(state.copyWith(loadState: ViewState.success, bookings: bookings, errorMessage: null, now: _clock())),
    );
  }

  void _onChanged(TripsBookingChanged event, Emitter<TripsState> emit) {
    final b = event.booking;
    final exists = state.bookings.any((x) => x.reference == b.reference);
    emit(
      state.copyWith(
        bookings: exists ? [for (final x in state.bookings) x.reference == b.reference ? b : x] : [b, ...state.bookings],
        now: _clock(),
      ),
    );
  }
}

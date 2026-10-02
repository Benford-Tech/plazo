import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../booking/data/models/public_booking_model.dart';
import '../../../booking/domain/usecases/booking_actions_use_cases.dart';

part 'manage_booking_bloc.freezed.dart';

sealed class ManageBookingEvent {
  const ManageBookingEvent();
}

/// "Modifier le vol" (empty: cleared).
class ManageFlightSubmitted extends ManageBookingEvent {
  const ManageFlightSubmitted({required this.reference, required this.flight});
  final String reference;
  final String? flight;
}

/// "Confirmer l'annulation".
class ManageCancelSubmitted extends ManageBookingEvent {
  const ManageCancelSubmitted(this.reference);
  final String reference;
}

@freezed
abstract class ManageBookingState with _$ManageBookingState {
  const factory ManageBookingState({
    @Default(ViewState.idle) ViewState viewState,
    /// API code of the failure (field code first: "invalid_flight"), translated by the sheet.
    String? errorCode,
    String? errorMessage,
    PublicBookingModel? booking,
  }) = _ManageBookingState;
}

/// The traveller's changes to a booking (same endpoints and rules as the site's "Ma réservation").
class ManageBookingBloc extends Bloc<ManageBookingEvent, ManageBookingState> {
  ManageBookingBloc(this._flight, this._cancel) : super(const ManageBookingState()) {
    on<ManageFlightSubmitted>((event, emit) async {
      emit(state.copyWith(viewState: ViewState.processing, errorCode: null, errorMessage: null));
      final result = await _flight(UpdateFlightParams(reference: event.reference, flight: event.flight));
      result.fold(
        (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: f.fields?['returnFlight'] ?? f.code, errorMessage: f.message)),
        (b) => emit(state.copyWith(viewState: ViewState.success, booking: b)),
      );
    });
    on<ManageCancelSubmitted>((event, emit) async {
      emit(state.copyWith(viewState: ViewState.processing, errorCode: null, errorMessage: null));
      final result = await _cancel(event.reference);
      result.fold(
        (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: f.code, errorMessage: f.message)),
        (b) => emit(state.copyWith(viewState: ViewState.success, booking: b)),
      );
    });
  }

  final UpdateFlightUseCase _flight;
  final CancelBookingUseCase _cancel;
}

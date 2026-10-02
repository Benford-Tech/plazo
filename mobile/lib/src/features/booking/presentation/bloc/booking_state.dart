part of 'booking_bloc.dart';

@freezed
abstract class BookingState with _$BookingState {
  const factory BookingState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState lookupState,
    String? reference,
    PublicBookingModel? booking,
    String? errorMessage,
    @Default([]) List<String> savedReferences,
  }) = _BookingState;
}

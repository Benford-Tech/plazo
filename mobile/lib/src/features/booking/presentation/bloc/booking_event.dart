part of 'booking_bloc.dart';

sealed class BookingEvent {
  const BookingEvent();
}

class BookingSavedRequested extends BookingEvent {
  const BookingSavedRequested();
}

/// /ma-reservation/REF?cle=TOKEN (token null: one saved earlier).
class BookingLinkOpened extends BookingEvent {
  const BookingLinkOpened(this.reference, {this.token});
  final String reference;
  final String? token;
}

class BookingLookupSubmitted extends BookingEvent {
  const BookingLookupSubmitted({required this.reference, required this.email});
  final String reference;
  final String email;
}

class BookingRefreshed extends BookingEvent {
  const BookingRefreshed();
}

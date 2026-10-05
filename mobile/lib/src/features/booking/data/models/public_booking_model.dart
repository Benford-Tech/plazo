import 'package:freezed_annotation/freezed_annotation.dart';

part 'public_booking_model.freezed.dart';
part 'public_booking_model.g.dart';

/// A booking as its traveller sees it (GET /public/bookings/:reference). Dates are local to the
/// parking, "2026-10-04T06:30".
@freezed
abstract class PublicBookingModel with _$PublicBookingModel {
  const factory PublicBookingModel({
    required String reference,
    required String status,
    /// "online": paid by card in the app or on the site; "on_site": paid at the parking.
    @Default('on_site') String paymentMode,
    BookingPaymentModel? payment,
    required BookingParkingModel parking,
    required String arrivalAt,
    required String returnAt,
    required String customerName,
    String? customerEmail,
    @Default('') String customerPhone,
    required String plate,
    String? returnFlight,

    /// Outbound flight (V-A) and, when tracked, when the shuttle to the terminal leaves (local).
    String? departureFlight,
    OutboundFlightModel? outbound,
    required int passengers,
    int? days,
    int? priceCents,
    @Default('non_refundable') String cancellationPolicy,
    /// Local datetime until which the traveller may cancel online; null when non-refundable.
    String? cancellableUntil,
    @Default(false) bool canCancel,
    @Default(false) bool canEditFlight,
  }) = _PublicBookingModel;

  const PublicBookingModel._();

  factory PublicBookingModel.fromJson(Map<String, dynamic> json) => _$PublicBookingModelFromJson(json);

  bool get online => paymentMode == 'online';

  /// Still running or to come (not cancelled, handed back or a no-show).
  bool get active => status != 'cancelled' && status != 'no_show' && status != 'returned';

  /// The hold of an online payment ended without payment.
  bool get holdExpired => status == 'cancelled' && payment?.status == 'expired';
}

@freezed
abstract class BookingPaymentModel with _$BookingPaymentModel {
  const factory BookingPaymentModel({
    /// pending, paid, expired, refunded.
    required String status,
    String? holdExpiresAt,
    int? holdSecondsLeft,
  }) = _BookingPaymentModel;

  factory BookingPaymentModel.fromJson(Map<String, dynamic> json) => _$BookingPaymentModelFromJson(json);
}

@freezed
abstract class BookingParkingModel with _$BookingParkingModel {
  const factory BookingParkingModel({
    required String title,
    String? slug,
    String? address,
    int? shuttleMinutes,
    String? openingHours,
    String? phone,
    BookingAirportModel? airport,
  }) = _BookingParkingModel;

  factory BookingParkingModel.fromJson(Map<String, dynamic> json) => _$BookingParkingModelFromJson(json);
}

@freezed
abstract class BookingAirportModel with _$BookingAirportModel {
  const factory BookingAirportModel({required String slug, required String name}) = _BookingAirportModel;

  factory BookingAirportModel.fromJson(Map<String, dynamic> json) => _$BookingAirportModelFromJson(json);
}

/// POST /public/bookings/lookup: the manage token of a booking, from its reference and email.
@freezed
abstract class BookingAccessModel with _$BookingAccessModel {
  const factory BookingAccessModel({required String reference, required String manageToken}) = _BookingAccessModel;

  factory BookingAccessModel.fromJson(Map<String, dynamic> json) => _$BookingAccessModelFromJson(json);
}

/// POST /public/bookings: the booking made, and its manage token (kept in the secure storage).
@freezed
abstract class CreatedBookingModel with _$CreatedBookingModel {
  const factory CreatedBookingModel({required String reference, required String manageToken, required PublicBookingModel booking}) =
      _CreatedBookingModel;

  factory CreatedBookingModel.fromJson(Map<String, dynamic> json) => _$CreatedBookingModelFromJson(json);
}

/// POST /public/bookings/:reference/payment-intent: what the native payment sheet confirms, or
/// `paid: true` when the payment already went through.
@freezed
abstract class PaymentIntentModel with _$PaymentIntentModel {
  const factory PaymentIntentModel({
    String? clientSecret,
    String? paymentIntentId,
    int? amountCents,
    String? currency,
    String? holdExpiresAt,
    @Default(false) bool paid,
  }) = _PaymentIntentModel;

  factory PaymentIntentModel.fromJson(Map<String, dynamic> json) => _$PaymentIntentModelFromJson(json);
}

/// POST /public/bookings/:reference/checkout: Stripe's payment page (web fallback), or `paid: true`.
@freezed
abstract class CheckoutModel with _$CheckoutModel {
  const factory CheckoutModel({String? url, @Default(false) bool paid}) = _CheckoutModel;

  factory CheckoutModel.fromJson(Map<String, dynamic> json) => _$CheckoutModelFromJson(json);
}

/// What the traveller types in the booking form (never a price: the API computes it).
class BookingInput {
  const BookingInput({
    required this.airport,
    required this.parking,
    required this.arrivalAt,
    required this.returnAt,
    required this.customerName,
    required this.customerPhone,
    required this.customerEmail,
    required this.plate,
    this.returnFlight,
    this.departureFlight,
    required this.passengers,
    required this.acceptTerms,
    this.idempotencyKey,
  });

  final String airport;
  final String parking;
  final String arrivalAt;
  final String returnAt;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final String plate;
  final String? returnFlight;
  final String? departureFlight;
  final int passengers;
  final bool acceptTerms;
  final String? idempotencyKey;

  Map<String, dynamic> toJson() => {
    'airport': airport,
    'parking': parking,
    'arrivalAt': arrivalAt,
    'returnAt': returnAt,
    'customerName': customerName,
    'customerPhone': customerPhone,
    'customerEmail': customerEmail,
    'plate': plate,
    if (returnFlight != null && returnFlight!.isNotEmpty) 'returnFlight': returnFlight,
    if (departureFlight != null && departureFlight!.isNotEmpty) 'departureFlight': departureFlight,
    'passengers': passengers,
    'acceptTerms': acceptTerms,
    if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
  };
}

/// The outbound flight as tracked, and the planned departure of the shuttle to the terminal (local "YYYY-MM-DDTHH:mm").
@freezed
abstract class OutboundFlightModel with _$OutboundFlightModel {
  const factory OutboundFlightModel({String? status, String? scheduledAt, String? estimatedAt, String? terminal, String? shuttleAt}) = _OutboundFlightModel;

  factory OutboundFlightModel.fromJson(Map<String, dynamic> json) => _$OutboundFlightModelFromJson(json);
}

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
    required BookingParkingModel parking,
    required String arrivalAt,
    required String returnAt,
    required String customerName,
    required String plate,
    String? returnFlight,
    required int passengers,
    int? days,
  }) = _PublicBookingModel;

  factory PublicBookingModel.fromJson(Map<String, dynamic> json) => _$PublicBookingModelFromJson(json);
}

@freezed
abstract class BookingParkingModel with _$BookingParkingModel {
  const factory BookingParkingModel({
    required String title,
    String? address,
    int? shuttleMinutes,
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

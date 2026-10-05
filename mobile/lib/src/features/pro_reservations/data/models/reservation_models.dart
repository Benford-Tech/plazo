import 'package:freezed_annotation/freezed_annotation.dart';

part 'reservation_models.freezed.dart';
part 'reservation_models.g.dart';

/// A booking as the staff routes return it (GET /internal/reservations/:id and the list).
@freezed
abstract class ReservationModel with _$ReservationModel {
  const ReservationModel._();

  const factory ReservationModel({
    required String id,
    required String reference,
    required String channel,
    String? channelDetail,
    required String status,
    required DateTime arrivalAt,
    required DateTime returnAt,
    required int passengers,
    required String customerName,
    required String customerPhone,
    String? customerEmail,
    required String plate,
    String? returnFlight,

    /// Outbound flight (V-A) and its tracking (take-off).
    String? departureFlight,
    String? departureStatus,
    DateTime? departureScheduledAt,
    DateTime? departureEstimatedAt,
    String? notes,
    String? externalReference,
    int? priceCents,
    @Default(false) bool overbooked,
    String? spotId,
    String? keyHook,
    String? paymentStatus,
    DateTime? createdAt,

    /// The sheet route carries the spot's code (bloc 2).
    ReservationSpotModel? spot,
  }) = _ReservationModel;

  factory ReservationModel.fromJson(Map<String, dynamic> json) => _$ReservationModelFromJson(json);

  bool get closed => status == 'returned' || status == 'cancelled' || status == 'no_show';
}

@freezed
abstract class ReservationSpotModel with _$ReservationSpotModel {
  const factory ReservationSpotModel({required String code}) = _ReservationSpotModel;

  factory ReservationSpotModel.fromJson(Map<String, dynamic> json) => _$ReservationSpotModelFromJson(json);
}

/// GET /internal/reservations?q=&page=&limit= (mongoose-style page).
@freezed
abstract class ReservationPageModel with _$ReservationPageModel {
  const factory ReservationPageModel({
    @Default([]) List<ReservationModel> docs,
    @Default(0) int totalDocs,
    @Default(1) int page,
    @Default(1) int totalPages,
    @Default(false) bool hasNextPage,
  }) = _ReservationPageModel;

  factory ReservationPageModel.fromJson(Map<String, dynamic> json) => _$ReservationPageModelFromJson(json);
}

/// GET /internal/capacity: the full nights of a stay, before saving.
@freezed
abstract class CapacityPreviewModel with _$CapacityPreviewModel {
  const factory CapacityPreviewModel({@Default(0) int nights, @Default([]) List<String> fullNights, @Default(false) bool canForce}) = _CapacityPreviewModel;

  factory CapacityPreviewModel.fromJson(Map<String, dynamic> json) => _$CapacityPreviewModelFromJson(json);
}

/// What an importer read in a confirmation email (dates local to the parking, "YYYY-MM-DDTHH:mm").
@freezed
abstract class ParsedBookingModel with _$ParsedBookingModel {
  const factory ParsedBookingModel({
    required String provider,
    String? externalReference,
    String? arrivalAt,
    String? returnAt,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    String? plate,
    String? returnFlight,
    String? departureFlight,
    int? passengers,
    int? priceCents,
  }) = _ParsedBookingModel;

  factory ParsedBookingModel.fromJson(Map<String, dynamic> json) => _$ParsedBookingModelFromJson(json);
}

@freezed
abstract class DuplicateRefModel with _$DuplicateRefModel {
  const factory DuplicateRefModel({required String id, required String reference}) = _DuplicateRefModel;

  factory DuplicateRefModel.fromJson(Map<String, dynamic> json) => _$DuplicateRefModelFromJson(json);
}

/// POST /internal/imports/email.
@freezed
abstract class ParsedEmailModel with _$ParsedEmailModel {
  const factory ParsedEmailModel({
    required ParsedBookingModel parsed,
    @Default([]) List<String> missing,
    DuplicateRefModel? duplicate,
    CapacityPreviewModel? capacity,
  }) = _ParsedEmailModel;

  factory ParsedEmailModel.fromJson(Map<String, dynamic> json) => _$ParsedEmailModelFromJson(json);
}

/// The form's values, sent as-is to POST (create) or PATCH (edit); dates local to the parking.
@freezed
abstract class ReservationInput with _$ReservationInput {
  const ReservationInput._();

  const factory ReservationInput({
    @Default('phone') String channel,
    String? channelDetail,
    required String arrivalAt,
    required String returnAt,
    @Default(2) int passengers,
    @Default('') String customerName,
    @Default('') String customerPhone,
    String? customerEmail,
    @Default('') String plate,
    String? returnFlight,
    String? departureFlight,
    String? notes,
    String? externalReference,
    int? priceCents,
    @Default(false) bool force,
  }) = _ReservationInput;

  factory ReservationInput.fromJson(Map<String, dynamic> json) => _$ReservationInputFromJson(json);

  /// Empty optional strings are dropped (the DTO refuses "" for an email or a flight).
  Map<String, dynamic> toBody({bool patch = false}) {
    final json = toJson();
    json.removeWhere((k, v) => v == null || (v is String && v.trim().isEmpty && k != 'customerName' && k != 'customerPhone' && k != 'plate'));
    if (!force) json.remove('force');
    if (patch) {
      json.remove('externalReference');
      json.remove('priceCents');
    }
    return json;
  }
}

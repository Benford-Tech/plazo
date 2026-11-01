import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../shared/child_seats/child_seats.dart';

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

    /// When the arrival was recorded (status « Sur place »); null while expected.
    DateTime? arrivedAt,
    required int passengers,
    required String customerName,

    /// 09/10/2026: the first and last name apart ("" from an older server); `customerName` is "Prénom Nom".
    @Default('') String customerFirstName,
    @Default('') String customerLastName,
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

    /// E (06/10/2026): the traveller's message for the parking, their vehicle, and today's return notice.
    String? customerNote,
    String? vehicleModel,
    String? vehicleColour,
    String? returnNoticeKind,
    String? returnNoticeText,
    DateTime? returnNoticeAt,
    String? externalReference,
    int? priceCents,
    @Default(false) bool overbooked,
    String? spotId,
    String? keyHook,

    /// 26/10/2026: when the keys were left (« Clés laissées »), a hook or not; null: « Clés ? ».
    DateTime? keysLeftAt,

    /// The stop serving the traveller (D-A); null: the airport.
    String? stopId,
    double? carLat,
    double? carLng,
    int? carAccuracyM,
    DateTime? carLocatedAt,
    String? carLocatedBy,
    String? carNote,
    String? paymentStatus,
    DateTime? createdAt,

    /// The statuses this staff member may set next, served by the API (06/10/2026).
    @Default([]) List<String> nextStatuses,

    /// The sheet route carries the spot's code (bloc 2).
    ReservationSpotModel? spot,

    /// S-C (07/10/2026): the file the car stands in and its position from the aisle (1 = first out).
    ReservationFileModel? file,
    int? filePosition,

    /// 14/10/2026: the arrival recorded by the driver at boarding (null: checked in at the desk, or not yet).
    BoardingCheckInModel? boardingCheckIn,

    /// 24/10/2026: the child car seats asked for the shuttle (none from an older API).
    @Default(ChildSeats.none) ChildSeats childSeats,

    /// « Voiturier au terminal » (27/10/2026): `shuttle` or `valet` (the car taken and brought back at the terminal).
    @Default('shuttle') String handover,
  }) = _ReservationModel;

  factory ReservationModel.fromJson(Map<String, dynamic> json) => _$ReservationModelFromJson(json);

  bool get closed => status == 'returned' || status == 'cancelled' || status == 'no_show';

  bool get valet => handover == 'valet';
}

/// « Embarquer en un geste » (14/10/2026): a traveller still expected when the shuttle left was checked in by its
/// driver; the valet finds the car among the arrivals to put away.
@freezed
abstract class BoardingCheckInModel with _$BoardingCheckInModel {
  const factory BoardingCheckInModel({String? driverFirstName, required DateTime at}) = _BoardingCheckInModel;

  factory BoardingCheckInModel.fromJson(Map<String, dynamic> json) => _$BoardingCheckInModelFromJson(json);
}

@freezed
abstract class ReservationSpotModel with _$ReservationSpotModel {
  const factory ReservationSpotModel({required String code}) = _ReservationSpotModel;

  factory ReservationSpotModel.fromJson(Map<String, dynamic> json) => _$ReservationSpotModelFromJson(json);
}

/// GET /internal/reservations?q=&page=&limit= (mongoose-style page). Chronological since 10/10/2026: by arrival, the
/// earliest first; without a search page 1 opens on today and pages 0, -1… go back in time (`hasPrevPage`).
@freezed
abstract class ReservationPageModel with _$ReservationPageModel {
  const factory ReservationPageModel({
    @Default([]) List<ReservationModel> docs,
    @Default(0) int totalDocs,
    @Default(1) int page,
    @Default(1) int totalPages,
    @Default(false) bool hasPrevPage,
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

    /// 09/10/2026: first and last name apart; the server stores "Prénom Nom" as `customerName`.
    @Default('') String customerFirstName,
    @Default('') String customerLastName,
    @Default('') String customerPhone,
    String? customerEmail,
    @Default('') String plate,
    String? returnFlight,
    String? departureFlight,
    String? notes,
    String? customerNote,
    String? vehicleModel,
    String? vehicleColour,
    String? externalReference,
    int? priceCents,
    @Default(false) bool force,

    /// 24/10/2026: the child car seats for the shuttle; an edit sends them only once changed (`seats` of [toBody]).
    @Default(ChildSeats.none) ChildSeats childSeats,

    /// 27/10/2026: `shuttle` or `valet`, always sent (the same value again changes nothing on the server).
    @Default('shuttle') String handover,
  }) = _ReservationInput;

  factory ReservationInput.fromJson(Map<String, dynamic> json) => _$ReservationInputFromJson(json);

  /// Empty optional strings are dropped (the DTO refuses "" for an email or a flight); an empty required one is sent,
  /// so that the API names the field. [names] false leaves the first and last name out of an edit: a one-word name
  /// (an older booking, a comparator's email) is stored with an empty last name, and an edit that does not touch the
  /// name must not require one (09/10/2026, as the pro space does). [price] true puts the amount in an edit, null to
  /// clear it (10/10/2026): only once changed, so that an untouched price is never sent. [seats] true puts the child
  /// seats in an edit (24/10/2026), likewise only once changed; a creation always sends them.
  Map<String, dynamic> toBody({bool patch = false, bool names = true, bool price = false, bool seats = false}) {
    final json = toJson();
    json.removeWhere((k, v) => v == null || (v is String && v.trim().isEmpty && !_keptWhenEmpty.contains(k)));
    if (!force) json.remove('force');
    // A plain map rather than the object (the same body whatever encodes it).
    json['childSeats'] = childSeats.toJson();
    if (patch) {
      json.remove('externalReference');
      json.remove('priceCents');
      if (price) json['priceCents'] = priceCents;
      if (!seats) json.remove('childSeats');
      if (!names) {
        json.remove('customerFirstName');
        json.remove('customerLastName');
      }
    }
    return json;
  }

  static const _keptWhenEmpty = {'customerFirstName', 'customerLastName', 'customerPhone', 'plate'};

  /// The name as typed, trimmed: whether an edit changed it.
  bool sameNameAs(ReservationInput other) =>
      customerFirstName.trim() == other.customerFirstName.trim() && customerLastName.trim() == other.customerLastName.trim();
}

@freezed
abstract class ReservationFileModel with _$ReservationFileModel {
  const factory ReservationFileModel({required String id, required String code, String? name}) = _ReservationFileModel;
  factory ReservationFileModel.fromJson(Map<String, dynamic> json) => _$ReservationFileModelFromJson(json);
}

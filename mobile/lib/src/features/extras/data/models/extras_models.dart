import 'package:freezed_annotation/freezed_annotation.dart';

part 'extras_models.freezed.dart';
part 'extras_models.g.dart';

/// Services for the car (21/10/2026): lavage intérieur, recharge hybride, recharge électrique, ordered on Plazo.

/// A service the traveller can order on their booking (`available` false with the `reason`: closed, too_late,
/// already_ordered, one_charge, not_online…).
@freezed
abstract class ExtraOfferModel with _$ExtraOfferModel {
  const factory ExtraOfferModel({
    required String kind,
    required String label,
    @Default('') String description,
    required int priceCents,
    @Default(true) bool available,
    String? reason,
  }) = _ExtraOfferModel;

  factory ExtraOfferModel.fromJson(Map<String, dynamic> json) => _$ExtraOfferModelFromJson(json);
}

/// A service ordered (paid): ordered (to do), done, refused (« Pas possible », refunded) or refunded.
@freezed
abstract class ExtraOrderModel with _$ExtraOrderModel {
  const ExtraOrderModel._();

  const factory ExtraOrderModel({
    required String id,
    required String kind,
    required String label,
    required int priceCents,
    required String status,
    @Default(false) bool withBooking,
    DateTime? paidAt,
    DateTime? doneAt,
    DateTime? refusedAt,
    String? refusedReason,
    DateTime? refundedAt,

    /// Staff only: who marked it done or not possible (first name).
    String? doneBy,
    String? refusedBy,
  }) = _ExtraOrderModel;

  factory ExtraOrderModel.fromJson(Map<String, dynamic> json) => _$ExtraOrderModelFromJson(json);

  bool get toDo => status == 'ordered';
}

/// GET /public/bookings/:ref/extras.
@freezed
abstract class TravellerExtrasModel with _$TravellerExtrasModel {
  const TravellerExtrasModel._();

  const factory TravellerExtrasModel({
    @Default(<ExtraOfferModel>[]) List<ExtraOfferModel> offers,
    @Default(<ExtraOrderModel>[]) List<ExtraOrderModel> orders,
    DateTime? orderUntil,
    @Default(false) bool canOrder,
  }) = _TravellerExtrasModel;

  factory TravellerExtrasModel.fromJson(Map<String, dynamic> json) => _$TravellerExtrasModelFromJson(json);

  /// Nothing to show: the parking offers nothing and nothing was ordered.
  bool get empty => offers.isEmpty && orders.isEmpty;

  /// The order of this kind that stands (to do or done), if any.
  ExtraOrderModel? activeOrder(String kind) => orders.where((o) => o.kind == kind && (o.status == 'ordered' || o.status == 'done')).firstOrNull;
}

/// The payment of a new order: the sheet's PaymentIntent, or `paid` when it went through already.
@freezed
abstract class ExtraPaymentModel with _$ExtraPaymentModel {
  const factory ExtraPaymentModel({
    String? clientSecret,
    String? paymentIntentId,
    int? amountCents,
    @Default('eur') String currency,
    @Default(false) bool paid,
  }) = _ExtraPaymentModel;

  factory ExtraPaymentModel.fromJson(Map<String, dynamic> json) => _$ExtraPaymentModelFromJson(json);
}

/// POST /public/bookings/:ref/extras.
@freezed
abstract class ExtraOrderResponseModel with _$ExtraOrderResponseModel {
  const factory ExtraOrderResponseModel({required ExtraOrderModel extra, required ExtraPaymentModel payment}) = _ExtraOrderResponseModel;

  factory ExtraOrderResponseModel.fromJson(Map<String, dynamic> json) => _$ExtraOrderResponseModelFromJson(json);
}

/// GET /internal/reservations/:id/extras.
@freezed
abstract class StaffExtrasModel with _$StaffExtrasModel {
  const factory StaffExtrasModel({@Default(<ExtraOrderModel>[]) List<ExtraOrderModel> extras}) = _StaffExtrasModel;

  factory StaffExtrasModel.fromJson(Map<String, dynamic> json) => _$StaffExtrasModelFromJson(json);
}

/// One service in the parking's settings: offered or not, and its price.
@freezed
abstract class ExtraSettingModel with _$ExtraSettingModel {
  const factory ExtraSettingModel({
    required String kind,
    required String label,
    @Default('') String description,
    @Default(false) bool enabled,
    required int priceCents,
    int? defaultPriceCents,
  }) = _ExtraSettingModel;

  factory ExtraSettingModel.fromJson(Map<String, dynamic> json) => _$ExtraSettingModelFromJson(json);
}

/// GET/PUT /internal/parkings/:id/extras (managers).
@freezed
abstract class ExtraSettingsModel with _$ExtraSettingsModel {
  const factory ExtraSettingsModel({@Default(24) int leadHours, @Default(<ExtraSettingModel>[]) List<ExtraSettingModel> offers}) =
      _ExtraSettingsModel;

  factory ExtraSettingsModel.fromJson(Map<String, dynamic> json) => _$ExtraSettingsModelFromJson(json);
}

/// The two charges exclude each other (a car is one or the other).
const chargeKinds = ['hybrid_charge', 'ev_charge'];

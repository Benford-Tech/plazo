import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/constants/product.g.dart';

part 'public_models.freezed.dart';
part 'public_models.g.dart';

/// Shapes of the public API (/api/public/...), the same the site reads (site/src/lib/types.ts).
/// Datetimes are local parking times "YYYY-MM-DDTHH:mm".

@freezed
abstract class LatLngModel with _$LatLngModel {
  const factory LatLngModel({required double lat, required double lng}) = _LatLngModel;

  factory LatLngModel.fromJson(Map<String, dynamic> json) => _$LatLngModelFromJson(json);
}

/// GET /public/airports: [{ code, name, city, slug }].
@freezed
abstract class AirportModel with _$AirportModel {
  const factory AirportModel({
    required String code,
    required String name,
    String? city,
    required String slug,
    LatLngModel? location,
  }) = _AirportModel;

  factory AirportModel.fromJson(Map<String, dynamic> json) => _$AirportModelFromJson(json);
}

/// One parking of the results, with its offer for the stay. `payment`: "online", "on_site" or
/// "unavailable" (payments on, but its operator cannot take them yet: not bookable online).
@freezed
abstract class SearchResultModel with _$SearchResultModel {
  const factory SearchResultModel({
    required String slug,
    required String title,
    @Default(<String>[]) List<String> services,
    int? shuttleMinutes,
    double? distanceKm,
    String? openingHours,
    @Default('non_refundable') String cancellationPolicy,
    String? photo,
    @Default('unavailable') String payment,
    LatLngModel? location,
    @Default(false) bool available,
    @Default(0) int days,
    int? priceCents,
    /// Fictional parking of the demo data: shown like the others, with a small "Démo" tag.
    @Default(false) bool isDemo,
  }) = _SearchResultModel;

  const SearchResultModel._();

  factory SearchResultModel.fromJson(Map<String, dynamic> json) => _$SearchResultModelFromJson(json);

  /// Available for every night, with a price: can be booked.
  bool get bookable => available && priceCents != null;
}

@freezed
abstract class SearchResponseModel with _$SearchResponseModel {
  const factory SearchResponseModel({
    @Default('unavailable') String payments,
    required AirportModel airport,
    @Default(<SearchResultModel>[]) List<SearchResultModel> results,
  }) = _SearchResponseModel;

  factory SearchResponseModel.fromJson(Map<String, dynamic> json) => _$SearchResponseModelFromJson(json);
}

@freezed
abstract class OfferModel with _$OfferModel {
  const factory OfferModel({required bool available, required int days, int? priceCents}) = _OfferModel;

  const OfferModel._();

  factory OfferModel.fromJson(Map<String, dynamic> json) => _$OfferModelFromJson(json);

  bool get bookable => available && priceCents != null;
}

@freezed
abstract class PricingTierModel with _$PricingTierModel {
  const factory PricingTierModel({required int days, required int priceCents}) = _PricingTierModel;

  factory PricingTierModel.fromJson(Map<String, dynamic> json) => _$PricingTierModelFromJson(json);
}

@freezed
abstract class PricingModel with _$PricingModel {
  const factory PricingModel({@Default(<PricingTierModel>[]) List<PricingTierModel> tiers, int? extraDayPriceCents}) = _PricingModel;

  factory PricingModel.fromJson(Map<String, dynamic> json) => _$PricingModelFromJson(json);
}

/// A parking's page (GET /public/airports/:airport/parkings/:slug).
@freezed
abstract class ParkingDetailModel with _$ParkingDetailModel {
  const factory ParkingDetailModel({
    required String slug,
    required String title,
    @Default(<String>[]) List<String> services,
    int? shuttleMinutes,
    double? distanceKm,
    String? openingHours,
    @Default('non_refundable') String cancellationPolicy,
    String? photo,
    @Default('unavailable') String payment,
    LatLngModel? location,
    String? description,
    @Default(<String>[]) List<String> photos,
    String? address,
    String? phone,
    @Default(PricingModel()) PricingModel pricing,
    @Default(false) bool isDemo,
  }) = _ParkingDetailModel;

  factory ParkingDetailModel.fromJson(Map<String, dynamic> json) => _$ParkingDetailModelFromJson(json);
}

@freezed
abstract class ParkingResponseModel with _$ParkingResponseModel {
  const factory ParkingResponseModel({
    @Default('unavailable') String payments,
    required AirportModel airport,
    required ParkingDetailModel parking,
    OfferModel? offer,
  }) = _ParkingResponseModel;

  factory ParkingResponseModel.fromJson(Map<String, dynamic> json) => _$ParkingResponseModelFromJson(json);
}

/// GET /public/airports/:slug/live (K-A, 06/10/2026): the airport's parkings and the shuttles on the
/// road right now, anonymous (a position, a direction, a vehicle; never a driver or a passenger).
@freezed
abstract class AirportLiveModel with _$AirportLiveModel {
  const factory AirportLiveModel({
    required String serverTime,
    required AirportModel airport,
    @Default(<LiveParkingModel>[]) List<LiveParkingModel> parkings,
    @Default(<LiveShuttleModel>[]) List<LiveShuttleModel> shuttles,
  }) = _AirportLiveModel;

  factory AirportLiveModel.fromJson(Map<String, dynamic> json) => _$AirportLiveModelFromJson(json);
}

@freezed
abstract class LiveParkingModel with _$LiveParkingModel {
  const factory LiveParkingModel({
    required String slug,
    required String title,
    @Default(<String>[]) List<String> services,
    int? shuttleMinutes,
    LatLngModel? location,
  }) = _LiveParkingModel;

  factory LiveParkingModel.fromJson(Map<String, dynamic> json) => _$LiveParkingModelFromJson(json);
}

@freezed
abstract class LiveVehicleModel with _$LiveVehicleModel {
  const factory LiveVehicleModel({String? model, String? colour}) = _LiveVehicleModel;

  factory LiveVehicleModel.fromJson(Map<String, dynamic> json) => _$LiveVehicleModelFromJson(json);
}

@freezed
abstract class LiveShuttleModel with _$LiveShuttleModel {
  const factory LiveShuttleModel({
    required String id,

    /// Slug of the parking the shuttle belongs to.
    required String parking,
    @Default('pickup') String direction,
    @Default(LiveVehicleModel()) LiveVehicleModel vehicle,
    LatLngModel? position,
    int? positionAgeSeconds,
    required String startedAt,
  }) = _LiveShuttleModel;

  const LiveShuttleModel._();

  factory LiveShuttleModel.fromJson(Map<String, dynamic> json) => _$LiveShuttleModelFromJson(json);

  bool get dropoff => direction == 'dropoff';
}

/// GET /public/payments/config: the native payment sheet's settings. `publishableKey` null: no
/// sheet (payments off, or no key on the server), the Checkout page is used instead.
@freezed
abstract class PaymentsConfigModel with _$PaymentsConfigModel {
  const factory PaymentsConfigModel({
    @Default('unavailable') String payments,
    String? publishableKey,
    @Default(Product.name) String merchantDisplayName,
    @Default('FR') String merchantCountryCode,
    @Default('eur') String currency,
  }) = _PaymentsConfigModel;

  factory PaymentsConfigModel.fromJson(Map<String, dynamic> json) => _$PaymentsConfigModelFromJson(json);
}

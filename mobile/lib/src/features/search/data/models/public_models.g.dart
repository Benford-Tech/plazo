// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_LatLngModel _$LatLngModelFromJson(Map<String, dynamic> json) => _LatLngModel(
  lat: (json['lat'] as num).toDouble(),
  lng: (json['lng'] as num).toDouble(),
);

Map<String, dynamic> _$LatLngModelToJson(_LatLngModel instance) =>
    <String, dynamic>{'lat': instance.lat, 'lng': instance.lng};

_AirportModel _$AirportModelFromJson(Map<String, dynamic> json) =>
    _AirportModel(
      code: json['code'] as String,
      name: json['name'] as String,
      city: json['city'] as String?,
      slug: json['slug'] as String,
      location: json['location'] == null
          ? null
          : LatLngModel.fromJson(json['location'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$AirportModelToJson(_AirportModel instance) =>
    <String, dynamic>{
      'code': instance.code,
      'name': instance.name,
      'city': instance.city,
      'slug': instance.slug,
      'location': instance.location,
    };

_SearchResultModel _$SearchResultModelFromJson(
  Map<String, dynamic> json,
) => _SearchResultModel(
  slug: json['slug'] as String,
  title: json['title'] as String,
  services:
      (json['services'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  shuttleMinutes: (json['shuttleMinutes'] as num?)?.toInt(),
  distanceKm: (json['distanceKm'] as num?)?.toDouble(),
  openingHours: json['openingHours'] as String?,
  cancellationPolicy: json['cancellationPolicy'] as String? ?? 'non_refundable',
  photo: json['photo'] as String?,
  payment: json['payment'] as String? ?? 'unavailable',
  location: json['location'] == null
      ? null
      : LatLngModel.fromJson(json['location'] as Map<String, dynamic>),
  available: json['available'] as bool? ?? false,
  days: (json['days'] as num?)?.toInt() ?? 0,
  priceCents: (json['priceCents'] as num?)?.toInt(),
  isDemo: json['isDemo'] as bool? ?? false,
  liveShuttle: json['liveShuttle'] as bool? ?? false,
);

Map<String, dynamic> _$SearchResultModelToJson(_SearchResultModel instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'title': instance.title,
      'services': instance.services,
      'shuttleMinutes': instance.shuttleMinutes,
      'distanceKm': instance.distanceKm,
      'openingHours': instance.openingHours,
      'cancellationPolicy': instance.cancellationPolicy,
      'photo': instance.photo,
      'payment': instance.payment,
      'location': instance.location,
      'available': instance.available,
      'days': instance.days,
      'priceCents': instance.priceCents,
      'isDemo': instance.isDemo,
      'liveShuttle': instance.liveShuttle,
    };

_SearchResponseModel _$SearchResponseModelFromJson(Map<String, dynamic> json) =>
    _SearchResponseModel(
      payments: json['payments'] as String? ?? 'unavailable',
      airport: AirportModel.fromJson(json['airport'] as Map<String, dynamic>),
      results:
          (json['results'] as List<dynamic>?)
              ?.map(
                (e) => SearchResultModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const <SearchResultModel>[],
    );

Map<String, dynamic> _$SearchResponseModelToJson(
  _SearchResponseModel instance,
) => <String, dynamic>{
  'payments': instance.payments,
  'airport': instance.airport,
  'results': instance.results,
};

_OfferModel _$OfferModelFromJson(Map<String, dynamic> json) => _OfferModel(
  available: json['available'] as bool,
  days: (json['days'] as num).toInt(),
  priceCents: (json['priceCents'] as num?)?.toInt(),
);

Map<String, dynamic> _$OfferModelToJson(_OfferModel instance) =>
    <String, dynamic>{
      'available': instance.available,
      'days': instance.days,
      'priceCents': instance.priceCents,
    };

_PricingTierModel _$PricingTierModelFromJson(Map<String, dynamic> json) =>
    _PricingTierModel(
      days: (json['days'] as num).toInt(),
      priceCents: (json['priceCents'] as num).toInt(),
    );

Map<String, dynamic> _$PricingTierModelToJson(_PricingTierModel instance) =>
    <String, dynamic>{'days': instance.days, 'priceCents': instance.priceCents};

_PricingModel _$PricingModelFromJson(Map<String, dynamic> json) =>
    _PricingModel(
      tiers:
          (json['tiers'] as List<dynamic>?)
              ?.map((e) => PricingTierModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <PricingTierModel>[],
      extraDayPriceCents: (json['extraDayPriceCents'] as num?)?.toInt(),
    );

Map<String, dynamic> _$PricingModelToJson(_PricingModel instance) =>
    <String, dynamic>{
      'tiers': instance.tiers,
      'extraDayPriceCents': instance.extraDayPriceCents,
    };

_ParkingDetailModel _$ParkingDetailModelFromJson(
  Map<String, dynamic> json,
) => _ParkingDetailModel(
  slug: json['slug'] as String,
  title: json['title'] as String,
  services:
      (json['services'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  shuttleMinutes: (json['shuttleMinutes'] as num?)?.toInt(),
  distanceKm: (json['distanceKm'] as num?)?.toDouble(),
  openingHours: json['openingHours'] as String?,
  cancellationPolicy: json['cancellationPolicy'] as String? ?? 'non_refundable',
  photo: json['photo'] as String?,
  payment: json['payment'] as String? ?? 'unavailable',
  location: json['location'] == null
      ? null
      : LatLngModel.fromJson(json['location'] as Map<String, dynamic>),
  description: json['description'] as String?,
  photos:
      (json['photos'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  address: json['address'] as String?,
  phone: json['phone'] as String?,
  pricing: json['pricing'] == null
      ? const PricingModel()
      : PricingModel.fromJson(json['pricing'] as Map<String, dynamic>),
  isDemo: json['isDemo'] as bool? ?? false,
);

Map<String, dynamic> _$ParkingDetailModelToJson(_ParkingDetailModel instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'title': instance.title,
      'services': instance.services,
      'shuttleMinutes': instance.shuttleMinutes,
      'distanceKm': instance.distanceKm,
      'openingHours': instance.openingHours,
      'cancellationPolicy': instance.cancellationPolicy,
      'photo': instance.photo,
      'payment': instance.payment,
      'location': instance.location,
      'description': instance.description,
      'photos': instance.photos,
      'address': instance.address,
      'phone': instance.phone,
      'pricing': instance.pricing,
      'isDemo': instance.isDemo,
    };

_ParkingResponseModel _$ParkingResponseModelFromJson(
  Map<String, dynamic> json,
) => _ParkingResponseModel(
  payments: json['payments'] as String? ?? 'unavailable',
  airport: AirportModel.fromJson(json['airport'] as Map<String, dynamic>),
  parking: ParkingDetailModel.fromJson(json['parking'] as Map<String, dynamic>),
  offer: json['offer'] == null
      ? null
      : OfferModel.fromJson(json['offer'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ParkingResponseModelToJson(
  _ParkingResponseModel instance,
) => <String, dynamic>{
  'payments': instance.payments,
  'airport': instance.airport,
  'parking': instance.parking,
  'offer': instance.offer,
};

_AirportLiveModel _$AirportLiveModelFromJson(Map<String, dynamic> json) =>
    _AirportLiveModel(
      serverTime: json['serverTime'] as String,
      airport: AirportModel.fromJson(json['airport'] as Map<String, dynamic>),
      parkings:
          (json['parkings'] as List<dynamic>?)
              ?.map((e) => LiveParkingModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <LiveParkingModel>[],
      shuttles:
          (json['shuttles'] as List<dynamic>?)
              ?.map((e) => LiveShuttleModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <LiveShuttleModel>[],
    );

Map<String, dynamic> _$AirportLiveModelToJson(_AirportLiveModel instance) =>
    <String, dynamic>{
      'serverTime': instance.serverTime,
      'airport': instance.airport,
      'parkings': instance.parkings,
      'shuttles': instance.shuttles,
    };

_LiveParkingModel _$LiveParkingModelFromJson(Map<String, dynamic> json) =>
    _LiveParkingModel(
      slug: json['slug'] as String,
      title: json['title'] as String,
      services:
          (json['services'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      shuttleMinutes: (json['shuttleMinutes'] as num?)?.toInt(),
      location: json['location'] == null
          ? null
          : LatLngModel.fromJson(json['location'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LiveParkingModelToJson(_LiveParkingModel instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'title': instance.title,
      'services': instance.services,
      'shuttleMinutes': instance.shuttleMinutes,
      'location': instance.location,
    };

_LiveVehicleModel _$LiveVehicleModelFromJson(Map<String, dynamic> json) =>
    _LiveVehicleModel(
      model: json['model'] as String?,
      colour: json['colour'] as String?,
    );

Map<String, dynamic> _$LiveVehicleModelToJson(_LiveVehicleModel instance) =>
    <String, dynamic>{'model': instance.model, 'colour': instance.colour};

_LiveShuttleModel _$LiveShuttleModelFromJson(Map<String, dynamic> json) =>
    _LiveShuttleModel(
      id: json['id'] as String,
      parking: json['parking'] as String,
      direction: json['direction'] as String? ?? 'pickup',
      vehicle: json['vehicle'] == null
          ? const LiveVehicleModel()
          : LiveVehicleModel.fromJson(json['vehicle'] as Map<String, dynamic>),
      position: json['position'] == null
          ? null
          : LatLngModel.fromJson(json['position'] as Map<String, dynamic>),
      positionAgeSeconds: (json['positionAgeSeconds'] as num?)?.toInt(),
      startedAt: json['startedAt'] as String,
    );

Map<String, dynamic> _$LiveShuttleModelToJson(_LiveShuttleModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'parking': instance.parking,
      'direction': instance.direction,
      'vehicle': instance.vehicle,
      'position': instance.position,
      'positionAgeSeconds': instance.positionAgeSeconds,
      'startedAt': instance.startedAt,
    };

_PaymentsConfigModel _$PaymentsConfigModelFromJson(Map<String, dynamic> json) =>
    _PaymentsConfigModel(
      payments: json['payments'] as String? ?? 'unavailable',
      publishableKey: json['publishableKey'] as String?,
      merchantDisplayName:
          json['merchantDisplayName'] as String? ?? Product.name,
      merchantCountryCode: json['merchantCountryCode'] as String? ?? 'FR',
      currency: json['currency'] as String? ?? 'eur',
    );

Map<String, dynamic> _$PaymentsConfigModelToJson(
  _PaymentsConfigModel instance,
) => <String, dynamic>{
  'payments': instance.payments,
  'publishableKey': instance.publishableKey,
  'merchantDisplayName': instance.merchantDisplayName,
  'merchantCountryCode': instance.merchantCountryCode,
  'currency': instance.currency,
};

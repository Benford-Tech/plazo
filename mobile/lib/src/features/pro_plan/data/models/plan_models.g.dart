// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'plan_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ParkingSummaryModel _$ParkingSummaryModelFromJson(Map<String, dynamic> json) =>
    _ParkingSummaryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      totalCapacity: (json['totalCapacity'] as num).toInt(),
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$ParkingSummaryModelToJson(
  _ParkingSummaryModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'totalCapacity': instance.totalCapacity,
  'lat': instance.lat,
  'lng': instance.lng,
};

_ParkingPlanModel _$ParkingPlanModelFromJson(Map<String, dynamic> json) =>
    _ParkingPlanModel(
      id: json['id'] as String,
      parkingId: json['parkingId'] as String,
      outline: json['outline'] as Map<String, dynamic>?,
      zones:
          (json['zones'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          const [],
      landmarks:
          (json['landmarks'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          const [],
      layout: json['layout'] as String?,
      generatedAt: json['generatedAt'] as String?,
    );

Map<String, dynamic> _$ParkingPlanModelToJson(_ParkingPlanModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'parkingId': instance.parkingId,
      'outline': instance.outline,
      'zones': instance.zones,
      'landmarks': instance.landmarks,
      'layout': instance.layout,
      'generatedAt': instance.generatedAt,
    };

_SpotModel _$SpotModelFromJson(Map<String, dynamic> json) => _SpotModel(
  id: json['id'] as String,
  code: json['code'] as String,
  row: (json['row'] as num).toInt(),
  index: (json['index'] as num).toInt(),
  kind: json['kind'] as String,
  active: json['active'] as bool,
  stayClass: json['stayClass'] as String?,
  geometry: (json['geometry'] as List<dynamic>)
      .map(
        (e) => (e as List<dynamic>).map((e) => (e as num).toDouble()).toList(),
      )
      .toList(),
);

Map<String, dynamic> _$SpotModelToJson(_SpotModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'row': instance.row,
      'index': instance.index,
      'kind': instance.kind,
      'active': instance.active,
      'stayClass': instance.stayClass,
      'geometry': instance.geometry,
    };

_ParkingPlanViewModel _$ParkingPlanViewModelFromJson(
  Map<String, dynamic> json,
) => _ParkingPlanViewModel(
  plan: ParkingPlanModel.fromJson(json['plan'] as Map<String, dynamic>),
  spots:
      (json['spots'] as List<dynamic>?)
          ?.map((e) => SpotModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  activeSpots: (json['activeSpots'] as num).toInt(),
  totalCapacity: (json['totalCapacity'] as num).toInt(),
);

Map<String, dynamic> _$ParkingPlanViewModelToJson(
  _ParkingPlanViewModel instance,
) => <String, dynamic>{
  'plan': instance.plan,
  'spots': instance.spots,
  'activeSpots': instance.activeSpots,
  'totalCapacity': instance.totalCapacity,
};

_PlanEstimateModel _$PlanEstimateModelFromJson(Map<String, dynamic> json) =>
    _PlanEstimateModel(
      usableArea: (json['usableArea'] as num).toInt(),
      totals: Map<String, int>.from(json['totals'] as Map),
    );

Map<String, dynamic> _$PlanEstimateModelToJson(_PlanEstimateModel instance) =>
    <String, dynamic>{
      'usableArea': instance.usableArea,
      'totals': instance.totals,
    };

_GeocodeResultModel _$GeocodeResultModelFromJson(Map<String, dynamic> json) =>
    _GeocodeResultModel(
      label: json['label'] as String,
      type: json['type'] as String,
      lon: (json['lon'] as num).toDouble(),
      lat: (json['lat'] as num).toDouble(),
    );

Map<String, dynamic> _$GeocodeResultModelToJson(_GeocodeResultModel instance) =>
    <String, dynamic>{
      'label': instance.label,
      'type': instance.type,
      'lon': instance.lon,
      'lat': instance.lat,
    };

_GeocodeResponseModel _$GeocodeResponseModelFromJson(
  Map<String, dynamic> json,
) => _GeocodeResponseModel(
  results:
      (json['results'] as List<dynamic>?)
          ?.map((e) => GeocodeResultModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$GeocodeResponseModelToJson(
  _GeocodeResponseModel instance,
) => <String, dynamic>{'results': instance.results};

_PlanViewEnvelope _$PlanViewEnvelopeFromJson(Map<String, dynamic> json) =>
    _PlanViewEnvelope(
      data: ParkingPlanViewModel.fromJson(json['data'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$PlanViewEnvelopeToJson(_PlanViewEnvelope instance) =>
    <String, dynamic>{'data': instance.data};

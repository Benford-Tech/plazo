// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'occupation_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OccupantModel _$OccupantModelFromJson(Map<String, dynamic> json) =>
    _OccupantModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      customerName: json['customerName'] as String,
      plate: json['plate'] as String,
      status: json['status'] as String,
      arrivalAt: json['arrivalAt'] as String,
      returnAt: json['returnAt'] as String,
      returnFlight: json['returnFlight'] as String?,
      spotId: json['spotId'] as String?,
      keyHook: json['keyHook'] as String?,
      onSite: json['onSite'] as bool? ?? false,
      leavesToday: json['leavesToday'] as bool? ?? false,
      spot: json['spot'] == null
          ? null
          : SpotRefModel.fromJson(json['spot'] as Map<String, dynamic>),
      suggestions:
          (json['suggestions'] as List<dynamic>?)
              ?.map((e) => SuggestionModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$OccupantModelToJson(_OccupantModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'reference': instance.reference,
      'customerName': instance.customerName,
      'plate': instance.plate,
      'status': instance.status,
      'arrivalAt': instance.arrivalAt,
      'returnAt': instance.returnAt,
      'returnFlight': instance.returnFlight,
      'spotId': instance.spotId,
      'keyHook': instance.keyHook,
      'onSite': instance.onSite,
      'leavesToday': instance.leavesToday,
      'spot': instance.spot,
      'suggestions': instance.suggestions,
    };

_SpotRefModel _$SpotRefModelFromJson(Map<String, dynamic> json) =>
    _SpotRefModel(code: json['code'] as String);

Map<String, dynamic> _$SpotRefModelToJson(_SpotRefModel instance) =>
    <String, dynamic>{'code': instance.code};

_SuggestionModel _$SuggestionModelFromJson(Map<String, dynamic> json) =>
    _SuggestionModel(
      spotId: json['spotId'] as String,
      code: json['code'] as String,
      distanceM: (json['distanceM'] as num?)?.toInt(),
      reason: json['reason'] as String,
    );

Map<String, dynamic> _$SuggestionModelToJson(_SuggestionModel instance) =>
    <String, dynamic>{
      'spotId': instance.spotId,
      'code': instance.code,
      'distanceM': instance.distanceM,
      'reason': instance.reason,
    };

_SpotStateModel _$SpotStateModelFromJson(Map<String, dynamic> json) =>
    _SpotStateModel(
      id: json['id'] as String,
      zoneId: json['zoneId'] as String,
      code: json['code'] as String,
      row: (json['row'] as num).toInt(),
      index: (json['index'] as num).toInt(),
      kind: json['kind'] as String,
      active: json['active'] as bool,
      geometry: (json['geometry'] as List<dynamic>)
          .map(
            (e) =>
                (e as List<dynamic>).map((e) => (e as num).toDouble()).toList(),
          )
          .toList(),
      occupant: json['occupant'] == null
          ? null
          : OccupantModel.fromJson(json['occupant'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$SpotStateModelToJson(_SpotStateModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'zoneId': instance.zoneId,
      'code': instance.code,
      'row': instance.row,
      'index': instance.index,
      'kind': instance.kind,
      'active': instance.active,
      'geometry': instance.geometry,
      'occupant': instance.occupant,
    };

_OccupationStatsModel _$OccupationStatsModelFromJson(
  Map<String, dynamic> json,
) => _OccupationStatsModel(
  active: (json['active'] as num).toInt(),
  occupied: (json['occupied'] as num).toInt(),
  leavingToday: (json['leavingToday'] as num).toInt(),
);

Map<String, dynamic> _$OccupationStatsModelToJson(
  _OccupationStatsModel instance,
) => <String, dynamic>{
  'active': instance.active,
  'occupied': instance.occupied,
  'leavingToday': instance.leavingToday,
};

_OccupationBoardModel _$OccupationBoardModelFromJson(
  Map<String, dynamic> json,
) => _OccupationBoardModel(
  date: json['date'] as String,
  spots:
      (json['spots'] as List<dynamic>?)
          ?.map((e) => SpotStateModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  arrivals:
      (json['arrivals'] as List<dynamic>?)
          ?.map((e) => OccupantModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  stats: OccupationStatsModel.fromJson(json['stats'] as Map<String, dynamic>),
);

Map<String, dynamic> _$OccupationBoardModelToJson(
  _OccupationBoardModel instance,
) => <String, dynamic>{
  'date': instance.date,
  'spots': instance.spots,
  'arrivals': instance.arrivals,
  'stats': instance.stats,
};

_VehicleSearchModel _$VehicleSearchModelFromJson(Map<String, dynamic> json) =>
    _VehicleSearchModel(
      results:
          (json['results'] as List<dynamic>?)
              ?.map((e) => OccupantModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$VehicleSearchModelToJson(_VehicleSearchModel instance) =>
    <String, dynamic>{'results': instance.results};

_AssignedModel _$AssignedModelFromJson(Map<String, dynamic> json) =>
    _AssignedModel(
      data: OccupantModel.fromJson(json['data'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$AssignedModelToJson(_AssignedModel instance) =>
    <String, dynamic>{'data': instance.data};

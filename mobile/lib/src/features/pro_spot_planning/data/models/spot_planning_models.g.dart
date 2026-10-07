// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spot_planning_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PlannedStayModel _$PlannedStayModelFromJson(Map<String, dynamic> json) =>
    _PlannedStayModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      customerName: json['customerName'] as String,
      plate: json['plate'] as String,
      status: json['status'] as String,
      arrivalAt: DateTime.parse(json['arrivalAt'] as String),
      returnAt: DateTime.parse(json['returnAt'] as String),
      returnFlight: json['returnFlight'] as String?,
      spotId: json['spotId'] as String?,
      keyHook: json['keyHook'] as String?,
      onSite: json['onSite'] as bool? ?? false,
      blockedBy:
          (json['blockedBy'] as List<dynamic>?)
              ?.map(
                (e) => PlanningBlockerModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const <PlanningBlockerModel>[],
    );

Map<String, dynamic> _$PlannedStayModelToJson(_PlannedStayModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'reference': instance.reference,
      'customerName': instance.customerName,
      'plate': instance.plate,
      'status': instance.status,
      'arrivalAt': instance.arrivalAt.toIso8601String(),
      'returnAt': instance.returnAt.toIso8601String(),
      'returnFlight': instance.returnFlight,
      'spotId': instance.spotId,
      'keyHook': instance.keyHook,
      'onSite': instance.onSite,
      'blockedBy': instance.blockedBy,
    };

_PlannedSpotModel _$PlannedSpotModelFromJson(Map<String, dynamic> json) =>
    _PlannedSpotModel(
      id: json['id'] as String,
      zoneId: json['zoneId'] as String,
      code: json['code'] as String,
      row: (json['row'] as num).toInt(),
      index: (json['index'] as num).toInt(),
      kind: json['kind'] as String,
      active: json['active'] as bool,
      stayClass: json['stayClass'] as String?,
      stays:
          (json['stays'] as List<dynamic>?)
              ?.map((e) => PlannedStayModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$PlannedSpotModelToJson(_PlannedSpotModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'zoneId': instance.zoneId,
      'code': instance.code,
      'row': instance.row,
      'index': instance.index,
      'kind': instance.kind,
      'active': instance.active,
      'stayClass': instance.stayClass,
      'stays': instance.stays,
    };

_DayLoadModel _$DayLoadModelFromJson(Map<String, dynamic> json) =>
    _DayLoadModel(
      date: json['date'] as String,
      placed: (json['placed'] as num).toInt(),
      unplaced: (json['unplaced'] as num).toInt(),
      capacity: (json['capacity'] as num).toInt(),
    );

Map<String, dynamic> _$DayLoadModelToJson(_DayLoadModel instance) =>
    <String, dynamic>{
      'date': instance.date,
      'placed': instance.placed,
      'unplaced': instance.unplaced,
      'capacity': instance.capacity,
    };

_PlanningAlertModel _$PlanningAlertModelFromJson(Map<String, dynamic> json) =>
    _PlanningAlertModel(
      kind: json['kind'] as String,
      date: json['date'] as String?,
      count: (json['count'] as num?)?.toInt(),
      spotCode: json['spotCode'] as String?,
      reference: json['reference'] as String?,
    );

Map<String, dynamic> _$PlanningAlertModelToJson(_PlanningAlertModel instance) =>
    <String, dynamic>{
      'kind': instance.kind,
      'date': instance.date,
      'count': instance.count,
      'spotCode': instance.spotCode,
      'reference': instance.reference,
    };

_SpotPlanningModel _$SpotPlanningModelFromJson(Map<String, dynamic> json) =>
    _SpotPlanningModel(
      from: json['from'] as String,
      days: (json['days'] as num).toInt(),
      capacity: (json['capacity'] as num?)?.toInt() ?? 0,
      spots:
          (json['spots'] as List<dynamic>?)
              ?.map((e) => PlannedSpotModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      unplaced:
          (json['unplaced'] as List<dynamic>?)
              ?.map((e) => PlannedStayModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      load:
          (json['load'] as List<dynamic>?)
              ?.map((e) => DayLoadModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      alerts:
          (json['alerts'] as List<dynamic>?)
              ?.map(
                (e) => PlanningAlertModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
    );

Map<String, dynamic> _$SpotPlanningModelToJson(_SpotPlanningModel instance) =>
    <String, dynamic>{
      'from': instance.from,
      'days': instance.days,
      'capacity': instance.capacity,
      'spots': instance.spots,
      'unplaced': instance.unplaced,
      'load': instance.load,
      'alerts': instance.alerts,
    };

_PreassignedModel _$PreassignedModelFromJson(Map<String, dynamic> json) =>
    _PreassignedModel(
      reservationId: json['reservationId'] as String,
      reference: json['reference'] as String,
      spotId: json['spotId'] as String,
      code: json['code'] as String,
    );

Map<String, dynamic> _$PreassignedModelToJson(_PreassignedModel instance) =>
    <String, dynamic>{
      'reservationId': instance.reservationId,
      'reference': instance.reference,
      'spotId': instance.spotId,
      'code': instance.code,
    };

_PreassignResultModel _$PreassignResultModelFromJson(
  Map<String, dynamic> json,
) => _PreassignResultModel(
  assigned:
      (json['assigned'] as List<dynamic>?)
          ?.map((e) => PreassignedModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  skipped:
      (json['skipped'] as List<dynamic>?)
          ?.map((e) => e as Map<String, dynamic>)
          .toList() ??
      const [],
);

Map<String, dynamic> _$PreassignResultModelToJson(
  _PreassignResultModel instance,
) => <String, dynamic>{
  'assigned': instance.assigned,
  'skipped': instance.skipped,
};

_PreassignEnvelopeModel _$PreassignEnvelopeModelFromJson(
  Map<String, dynamic> json,
) => _PreassignEnvelopeModel(
  data: PreassignResultModel.fromJson(json['data'] as Map<String, dynamic>),
);

Map<String, dynamic> _$PreassignEnvelopeModelToJson(
  _PreassignEnvelopeModel instance,
) => <String, dynamic>{'data': instance.data};

_PlanningBlockerModel _$PlanningBlockerModelFromJson(
  Map<String, dynamic> json,
) => _PlanningBlockerModel(
  reservationId: json['reservationId'] as String,
  reference: json['reference'] as String,
  spotCode: json['spotCode'] as String,
  returnAt: DateTime.parse(json['returnAt'] as String),
);

Map<String, dynamic> _$PlanningBlockerModelToJson(
  _PlanningBlockerModel instance,
) => <String, dynamic>{
  'reservationId': instance.reservationId,
  'reference': instance.reference,
  'spotCode': instance.spotCode,
  'returnAt': instance.returnAt.toIso8601String(),
};

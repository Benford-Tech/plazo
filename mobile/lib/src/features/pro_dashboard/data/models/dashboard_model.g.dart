// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_DashboardModel _$DashboardModelFromJson(Map<String, dynamic> json) => _DashboardModel(
  serverTime: DateTime.parse(json['serverTime'] as String),
  date: json['date'] as String,
  parking: DashboardParkingModel.fromJson(json['parking'] as Map<String, dynamic>),
  counts: DashboardCountsModel.fromJson(json['counts'] as Map<String, dynamic>),
  services: DashboardServicesModel.fromJson(json['services'] as Map<String, dynamic>),
  alerts: (json['alerts'] as List<dynamic>?)?.map((e) => DashboardAlertModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  breakdown: DashboardBreakdownModel.fromJson(json['breakdown'] as Map<String, dynamic>),
  vehicles: (json['vehicles'] as List<dynamic>?)?.map((e) => DashboardVehicleModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
);

Map<String, dynamic> _$DashboardModelToJson(_DashboardModel instance) => <String, dynamic>{
  'serverTime': instance.serverTime.toIso8601String(),
  'date': instance.date,
  'parking': instance.parking,
  'counts': instance.counts,
  'services': instance.services,
  'alerts': instance.alerts,
  'breakdown': instance.breakdown,
  'vehicles': instance.vehicles,
};

_DashboardParkingModel _$DashboardParkingModelFromJson(Map<String, dynamic> json) => _DashboardParkingModel(
  id: json['id'] as String,
  name: json['name'] as String,
  timezone: json['timezone'] as String? ?? 'Europe/Paris',
  bookableCapacity: (json['bookableCapacity'] as num?)?.toInt() ?? 0,
  plannedSpots: (json['plannedSpots'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$DashboardParkingModelToJson(_DashboardParkingModel instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'timezone': instance.timezone,
  'bookableCapacity': instance.bookableCapacity,
  'plannedSpots': instance.plannedSpots,
};

_DashboardCountsModel _$DashboardCountsModelFromJson(Map<String, dynamic> json) => _DashboardCountsModel(
  onSite: (json['onSite'] as num?)?.toInt() ?? 0,
  arrivalsToday: (json['arrivalsToday'] as num?)?.toInt() ?? 0,
  arrivedToday: (json['arrivedToday'] as num?)?.toInt() ?? 0,
  returnsToday: (json['returnsToday'] as num?)?.toInt() ?? 0,
  shuttlesRunning: (json['shuttlesRunning'] as num?)?.toInt() ?? 0,
  freeSpots: (json['freeSpots'] as num?)?.toInt(),
  toTreat: (json['toTreat'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$DashboardCountsModelToJson(_DashboardCountsModel instance) => <String, dynamic>{
  'onSite': instance.onSite,
  'arrivalsToday': instance.arrivalsToday,
  'arrivedToday': instance.arrivedToday,
  'returnsToday': instance.returnsToday,
  'shuttlesRunning': instance.shuttlesRunning,
  'freeSpots': instance.freeSpots,
  'toTreat': instance.toTreat,
};

_DashboardFlightsModel _$DashboardFlightsModelFromJson(Map<String, dynamic> json) => _DashboardFlightsModel(
  configured: json['configured'] as bool? ?? false,
  provider: json['provider'] as String?,
  lastCheckedAt: json['lastCheckedAt'] == null ? null : DateTime.parse(json['lastCheckedAt'] as String),
);

Map<String, dynamic> _$DashboardFlightsModelToJson(_DashboardFlightsModel instance) => <String, dynamic>{
  'configured': instance.configured,
  'provider': instance.provider,
  'lastCheckedAt': instance.lastCheckedAt?.toIso8601String(),
};

_DashboardSmsModel _$DashboardSmsModelFromJson(Map<String, dynamic> json) => _DashboardSmsModel(
  mode: json['mode'] as String? ?? 'none',
  pending: (json['pending'] as num?)?.toInt() ?? 0,
  stale: json['stale'] as bool? ?? false,
  lastSentAt: json['lastSentAt'] == null ? null : DateTime.parse(json['lastSentAt'] as String),
);

Map<String, dynamic> _$DashboardSmsModelToJson(_DashboardSmsModel instance) => <String, dynamic>{
  'mode': instance.mode,
  'pending': instance.pending,
  'stale': instance.stale,
  'lastSentAt': instance.lastSentAt?.toIso8601String(),
};

_DashboardPushModel _$DashboardPushModelFromJson(Map<String, dynamic> json) =>
    _DashboardPushModel(configured: json['configured'] as bool? ?? false, devices: (json['devices'] as num?)?.toInt() ?? 0);

Map<String, dynamic> _$DashboardPushModelToJson(_DashboardPushModel instance) => <String, dynamic>{
  'configured': instance.configured,
  'devices': instance.devices,
};

_DashboardStripeModel _$DashboardStripeModelFromJson(Map<String, dynamic> json) =>
    _DashboardStripeModel(connected: json['connected'] as bool? ?? false, payoutsEnabled: json['payoutsEnabled'] as bool? ?? false);

Map<String, dynamic> _$DashboardStripeModelToJson(_DashboardStripeModel instance) => <String, dynamic>{
  'connected': instance.connected,
  'payoutsEnabled': instance.payoutsEnabled,
};

_DashboardServicesModel _$DashboardServicesModelFromJson(Map<String, dynamic> json) => _DashboardServicesModel(
  flights: json['flights'] == null ? const DashboardFlightsModel() : DashboardFlightsModel.fromJson(json['flights'] as Map<String, dynamic>),
  sms: json['sms'] == null ? const DashboardSmsModel() : DashboardSmsModel.fromJson(json['sms'] as Map<String, dynamic>),
  push: json['push'] == null ? const DashboardPushModel() : DashboardPushModel.fromJson(json['push'] as Map<String, dynamic>),
  stripe: json['stripe'] == null ? const DashboardStripeModel() : DashboardStripeModel.fromJson(json['stripe'] as Map<String, dynamic>),
  lastImportAt: json['lastImportAt'] == null ? null : DateTime.parse(json['lastImportAt'] as String),
);

Map<String, dynamic> _$DashboardServicesModelToJson(_DashboardServicesModel instance) => <String, dynamic>{
  'flights': instance.flights,
  'sms': instance.sms,
  'push': instance.push,
  'stripe': instance.stripe,
  'lastImportAt': instance.lastImportAt?.toIso8601String(),
};

_DashboardAlertModel _$DashboardAlertModelFromJson(Map<String, dynamic> json) => _DashboardAlertModel(
  kind: json['kind'] as String,
  severity: json['severity'] as String? ?? 'todo',
  reservationId: json['reservationId'] as String?,
  reference: json['reference'] as String?,
  customerName: json['customerName'] as String?,
  plate: json['plate'] as String?,
  detail: json['detail'] as String?,
  since: json['since'] == null ? null : DateTime.parse(json['since'] as String),
  minutes: (json['minutes'] as num?)?.toInt(),
);

Map<String, dynamic> _$DashboardAlertModelToJson(_DashboardAlertModel instance) => <String, dynamic>{
  'kind': instance.kind,
  'severity': instance.severity,
  'reservationId': instance.reservationId,
  'reference': instance.reference,
  'customerName': instance.customerName,
  'plate': instance.plate,
  'detail': instance.detail,
  'since': instance.since?.toIso8601String(),
  'minutes': instance.minutes,
};

_DashboardBreakdownModel _$DashboardBreakdownModelFromJson(Map<String, dynamic> json) => _DashboardBreakdownModel(
  onSiteQuiet: (json['onSiteQuiet'] as num?)?.toInt() ?? 0,
  toPlaceToday: (json['toPlaceToday'] as num?)?.toInt() ?? 0,
  returnsThisWeek: (json['returnsThisWeek'] as num?)?.toInt() ?? 0,
  toTreat: (json['toTreat'] as num?)?.toInt() ?? 0,
  freeSpots: (json['freeSpots'] as num?)?.toInt(),
);

Map<String, dynamic> _$DashboardBreakdownModelToJson(_DashboardBreakdownModel instance) => <String, dynamic>{
  'onSiteQuiet': instance.onSiteQuiet,
  'toPlaceToday': instance.toPlaceToday,
  'returnsThisWeek': instance.returnsThisWeek,
  'toTreat': instance.toTreat,
  'freeSpots': instance.freeSpots,
};

_DashboardVehicleModel _$DashboardVehicleModelFromJson(Map<String, dynamic> json) => _DashboardVehicleModel(
  id: json['id'] as String,
  reference: json['reference'] as String,
  customerName: json['customerName'] as String,
  passengers: (json['passengers'] as num?)?.toInt() ?? 1,
  plate: json['plate'] as String,
  status: json['status'] as String,
  arrivalAt: json['arrivalAt'] as String,
  returnAt: json['returnAt'] as String,
  spotCode: json['spotCode'] as String?,
  stayClass: json['stayClass'] as String?,
  keyHook: json['keyHook'] as String?,
  returnFlight: json['returnFlight'] as String?,
  flightStatus: json['flightStatus'] as String?,
  flightEstimatedAt: json['flightEstimatedAt'] as String?,
  flightLandedAt: json['flightLandedAt'] as String?,
  tripDirection: json['tripDirection'] as String?,
  stopName: json['stopName'] as String?,
  returnsToday: json['returnsToday'] as bool? ?? false,
);

Map<String, dynamic> _$DashboardVehicleModelToJson(_DashboardVehicleModel instance) => <String, dynamic>{
  'id': instance.id,
  'reference': instance.reference,
  'customerName': instance.customerName,
  'passengers': instance.passengers,
  'plate': instance.plate,
  'status': instance.status,
  'arrivalAt': instance.arrivalAt,
  'returnAt': instance.returnAt,
  'spotCode': instance.spotCode,
  'stayClass': instance.stayClass,
  'keyHook': instance.keyHook,
  'returnFlight': instance.returnFlight,
  'flightStatus': instance.flightStatus,
  'flightEstimatedAt': instance.flightEstimatedAt,
  'flightLandedAt': instance.flightLandedAt,
  'tripDirection': instance.tripDirection,
  'stopName': instance.stopName,
  'returnsToday': instance.returnsToday,
};

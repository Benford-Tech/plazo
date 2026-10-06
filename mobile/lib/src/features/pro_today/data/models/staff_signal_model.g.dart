// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'staff_signal_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SignalPositionModel _$SignalPositionModelFromJson(Map<String, dynamic> json) =>
    _SignalPositionModel(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      accuracyM: (json['accuracyM'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$SignalPositionModelToJson(
  _SignalPositionModel instance,
) => <String, dynamic>{
  'lat': instance.lat,
  'lng': instance.lng,
  'accuracyM': instance.accuracyM,
};

_StaffSignalModel _$StaffSignalModelFromJson(
  Map<String, dynamic> json,
) => _StaffSignalModel(
  id: json['id'] as String,
  reservationId: json['reservationId'] as String,
  reference: json['reference'] as String,
  kind: $enumDecode(_$ArrivalKindEnumMap, json['kind']),
  state: $enumDecode(
    _$ArrivalSignalStateEnumMap,
    json['state'],
    unknownValue: ArrivalSignalState.ended,
  ),
  customerName: json['customerName'] as String,
  plate: json['plate'] as String,
  passengers: (json['passengers'] as num).toInt(),
  returnFlight: json['returnFlight'] as String?,
  scheduledAt: DateTime.parse(json['scheduledAt'] as String),
  startedAt: DateTime.parse(json['startedAt'] as String),
  expiresAt: DateTime.parse(json['expiresAt'] as String),
  distanceM: (json['distanceM'] as num?)?.toInt(),
  etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
  etaAt: json['etaAt'] == null ? null : DateTime.parse(json['etaAt'] as String),
  announcedMinutes: (json['announcedMinutes'] as num?)?.toInt(),
  atMeetingPointAt: json['atMeetingPointAt'] == null
      ? null
      : DateTime.parse(json['atMeetingPointAt'] as String),
  position: json['position'] == null
      ? null
      : SignalPositionModel.fromJson(json['position'] as Map<String, dynamic>),
  positionUpdatedAt: json['positionUpdatedAt'] == null
      ? null
      : DateTime.parse(json['positionUpdatedAt'] as String),
  positionAgeSeconds: (json['positionAgeSeconds'] as num?)?.toInt(),
  meetingPoint: json['meetingPoint'] == null
      ? null
      : MeetingPointModel.fromJson(
          json['meetingPoint'] as Map<String, dynamic>,
        ),
  note: json['note'] as String?,
);

Map<String, dynamic> _$StaffSignalModelToJson(_StaffSignalModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'reservationId': instance.reservationId,
      'reference': instance.reference,
      'kind': _$ArrivalKindEnumMap[instance.kind]!,
      'state': _$ArrivalSignalStateEnumMap[instance.state]!,
      'customerName': instance.customerName,
      'plate': instance.plate,
      'passengers': instance.passengers,
      'returnFlight': instance.returnFlight,
      'scheduledAt': instance.scheduledAt.toIso8601String(),
      'startedAt': instance.startedAt.toIso8601String(),
      'expiresAt': instance.expiresAt.toIso8601String(),
      'distanceM': instance.distanceM,
      'etaMinutes': instance.etaMinutes,
      'etaAt': instance.etaAt?.toIso8601String(),
      'announcedMinutes': instance.announcedMinutes,
      'atMeetingPointAt': instance.atMeetingPointAt?.toIso8601String(),
      'position': instance.position,
      'positionUpdatedAt': instance.positionUpdatedAt?.toIso8601String(),
      'positionAgeSeconds': instance.positionAgeSeconds,
      'meetingPoint': instance.meetingPoint,
      'note': instance.note,
    };

const _$ArrivalKindEnumMap = {
  ArrivalKind.outbound: 'outbound',
  ArrivalKind.returnTrip: 'return',
};

const _$ArrivalSignalStateEnumMap = {
  ArrivalSignalState.sharing: 'sharing',
  ArrivalSignalState.announced: 'announced',
  ArrivalSignalState.atMeetingPoint: 'at_meeting_point',
  ArrivalSignalState.ended: 'ended',
};

_LiveArrivalsModel _$LiveArrivalsModelFromJson(Map<String, dynamic> json) =>
    _LiveArrivalsModel(
      serverTime: DateTime.parse(json['serverTime'] as String),
      signals:
          (json['signals'] as List<dynamic>?)
              ?.map((e) => StaffSignalModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$LiveArrivalsModelToJson(_LiveArrivalsModel instance) =>
    <String, dynamic>{
      'serverTime': instance.serverTime.toIso8601String(),
      'signals': instance.signals,
    };

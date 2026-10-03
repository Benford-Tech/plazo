// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'arrival_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_MeetingPointModel _$MeetingPointModelFromJson(Map<String, dynamic> json) =>
    _MeetingPointModel(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      source: json['source'] as String,
      label: json['label'] as String?,
      instructions: json['instructions'] as String?,
      photoUrl: json['photoUrl'] as String?,
    );

Map<String, dynamic> _$MeetingPointModelToJson(_MeetingPointModel instance) =>
    <String, dynamic>{
      'lat': instance.lat,
      'lng': instance.lng,
      'source': instance.source,
      'label': instance.label,
      'instructions': instance.instructions,
      'photoUrl': instance.photoUrl,
    };

_ArrivalMomentModel _$ArrivalMomentModelFromJson(Map<String, dynamic> json) =>
    _ArrivalMomentModel(
      kind: $enumDecode(
        _$ArrivalKindEnumMap,
        json['kind'],
        unknownValue: ArrivalKind.outbound,
      ),
      open: json['open'] as bool,
      opensAt: DateTime.parse(json['opensAt'] as String),
      closesAt: DateTime.parse(json['closesAt'] as String),
    );

Map<String, dynamic> _$ArrivalMomentModelToJson(_ArrivalMomentModel instance) =>
    <String, dynamic>{
      'kind': _$ArrivalKindEnumMap[instance.kind]!,
      'open': instance.open,
      'opensAt': instance.opensAt.toIso8601String(),
      'closesAt': instance.closesAt.toIso8601String(),
    };

const _$ArrivalKindEnumMap = {
  ArrivalKind.outbound: 'outbound',
  ArrivalKind.returnTrip: 'return',
};

_ArrivalSignalModel _$ArrivalSignalModelFromJson(Map<String, dynamic> json) =>
    _ArrivalSignalModel(
      kind: $enumDecode(_$ArrivalKindEnumMap, json['kind']),
      state: $enumDecode(
        _$ArrivalSignalStateEnumMap,
        json['state'],
        unknownValue: ArrivalSignalState.ended,
      ),
      endReason: json['endReason'] as String?,
      startedAt: DateTime.parse(json['startedAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      secondsLeft: (json['secondsLeft'] as num).toInt(),
      distanceM: (json['distanceM'] as num?)?.toInt(),
      etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
      etaAt: json['etaAt'] == null
          ? null
          : DateTime.parse(json['etaAt'] as String),
      announcedMinutes: (json['announcedMinutes'] as num?)?.toInt(),
      atMeetingPointAt: json['atMeetingPointAt'] == null
          ? null
          : DateTime.parse(json['atMeetingPointAt'] as String),
      positionUpdatedAt: json['positionUpdatedAt'] == null
          ? null
          : DateTime.parse(json['positionUpdatedAt'] as String),
    );

Map<String, dynamic> _$ArrivalSignalModelToJson(_ArrivalSignalModel instance) =>
    <String, dynamic>{
      'kind': _$ArrivalKindEnumMap[instance.kind]!,
      'state': _$ArrivalSignalStateEnumMap[instance.state]!,
      'endReason': instance.endReason,
      'startedAt': instance.startedAt.toIso8601String(),
      'expiresAt': instance.expiresAt.toIso8601String(),
      'secondsLeft': instance.secondsLeft,
      'distanceM': instance.distanceM,
      'etaMinutes': instance.etaMinutes,
      'etaAt': instance.etaAt?.toIso8601String(),
      'announcedMinutes': instance.announcedMinutes,
      'atMeetingPointAt': instance.atMeetingPointAt?.toIso8601String(),
      'positionUpdatedAt': instance.positionUpdatedAt?.toIso8601String(),
    };

const _$ArrivalSignalStateEnumMap = {
  ArrivalSignalState.sharing: 'sharing',
  ArrivalSignalState.announced: 'announced',
  ArrivalSignalState.atMeetingPoint: 'at_meeting_point',
  ArrivalSignalState.ended: 'ended',
};

_ArrivalRulesModel _$ArrivalRulesModelFromJson(Map<String, dynamic> json) =>
    _ArrivalRulesModel(
      maxMinutes: (json['maxMinutes'] as num?)?.toInt() ?? 120,
      arrivedWithinMeters:
          (json['arrivedWithinMeters'] as num?)?.toInt() ?? 150,
      positionIntervalSeconds:
          (json['positionIntervalSeconds'] as num?)?.toInt() ?? 10,
      announceMinutes:
          (json['announceMinutes'] as List<dynamic>?)
              ?.map((e) => (e as num).toInt())
              .toList() ??
          const [10, 20, 30],
    );

Map<String, dynamic> _$ArrivalRulesModelToJson(_ArrivalRulesModel instance) =>
    <String, dynamic>{
      'maxMinutes': instance.maxMinutes,
      'arrivedWithinMeters': instance.arrivedWithinMeters,
      'positionIntervalSeconds': instance.positionIntervalSeconds,
      'announceMinutes': instance.announceMinutes,
    };

_ArrivalModel _$ArrivalModelFromJson(Map<String, dynamic> json) =>
    _ArrivalModel(
      reference: json['reference'] as String,
      moment: json['moment'] == null
          ? null
          : ArrivalMomentModel.fromJson(json['moment'] as Map<String, dynamic>),
      meetingPoint: json['meetingPoint'] == null
          ? null
          : MeetingPointModel.fromJson(
              json['meetingPoint'] as Map<String, dynamic>,
            ),
      signal: json['signal'] == null
          ? null
          : ArrivalSignalModel.fromJson(json['signal'] as Map<String, dynamic>),
      rules: json['rules'] == null
          ? const ArrivalRulesModel()
          : ArrivalRulesModel.fromJson(json['rules'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ArrivalModelToJson(_ArrivalModel instance) =>
    <String, dynamic>{
      'reference': instance.reference,
      'moment': instance.moment,
      'meetingPoint': instance.meetingPoint,
      'signal': instance.signal,
      'rules': instance.rules,
    };

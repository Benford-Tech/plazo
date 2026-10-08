// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'files_planning_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_FilesPlanningFileModel _$FilesPlanningFileModelFromJson(
  Map<String, dynamic> json,
) => _FilesPlanningFileModel(
  id: json['id'] as String,
  code: json['code'] as String,
  name: json['name'] as String?,
  capacity: (json['capacity'] as num).toInt(),
  active: json['active'] as bool,
  plannedDay: json['plannedDay'] as String?,
  day: json['day'] as String?,
  cars: (json['cars'] as num).toInt(),
  sound: json['sound'] as bool,
  keptByHand: json['keptByHand'] as bool? ?? false,
);

Map<String, dynamic> _$FilesPlanningFileModelToJson(
  _FilesPlanningFileModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'code': instance.code,
  'name': instance.name,
  'capacity': instance.capacity,
  'active': instance.active,
  'plannedDay': instance.plannedDay,
  'day': instance.day,
  'cars': instance.cars,
  'sound': instance.sound,
  'keptByHand': instance.keptByHand,
};

_FilesPlanningDayModel _$FilesPlanningDayModelFromJson(
  Map<String, dynamic> json,
) => _FilesPlanningDayModel(
  date: json['date'] as String,
  returns: (json['returns'] as num).toInt(),
  placed: (json['placed'] as num).toInt(),
  toCome: (json['toCome'] as num).toInt(),
  onSite: (json['onSite'] as num).toInt(),
  filesServing:
      (json['filesServing'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const <String>[],
  filesKept:
      (json['filesKept'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  room: (json['room'] as num).toInt(),
  missing: (json['missing'] as num).toInt(),
);

Map<String, dynamic> _$FilesPlanningDayModelToJson(
  _FilesPlanningDayModel instance,
) => <String, dynamic>{
  'date': instance.date,
  'returns': instance.returns,
  'placed': instance.placed,
  'toCome': instance.toCome,
  'onSite': instance.onSite,
  'filesServing': instance.filesServing,
  'filesKept': instance.filesKept,
  'room': instance.room,
  'missing': instance.missing,
};

_FilesPlanningAlertModel _$FilesPlanningAlertModelFromJson(
  Map<String, dynamic> json,
) => _FilesPlanningAlertModel(
  kind: json['kind'] as String,
  date: json['date'] as String?,
  count: (json['count'] as num?)?.toInt(),
  fileCode: json['fileCode'] as String?,
);

Map<String, dynamic> _$FilesPlanningAlertModelToJson(
  _FilesPlanningAlertModel instance,
) => <String, dynamic>{
  'kind': instance.kind,
  'date': instance.date,
  'count': instance.count,
  'fileCode': instance.fileCode,
};

_FilesPlanningModel _$FilesPlanningModelFromJson(Map<String, dynamic> json) =>
    _FilesPlanningModel(
      from: json['from'] as String,
      days: (json['days'] as num).toInt(),
      timezone: json['timezone'] as String,
      today: json['today'] as String?,
      capacity: (json['capacity'] as num?)?.toInt() ?? 0,
      files:
          (json['files'] as List<dynamic>?)
              ?.map(
                (e) =>
                    FilesPlanningFileModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const <FilesPlanningFileModel>[],
      load:
          (json['load'] as List<dynamic>?)
              ?.map(
                (e) =>
                    FilesPlanningDayModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const <FilesPlanningDayModel>[],
      alerts:
          (json['alerts'] as List<dynamic>?)
              ?.map(
                (e) =>
                    FilesPlanningAlertModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const <FilesPlanningAlertModel>[],
    );

Map<String, dynamic> _$FilesPlanningModelToJson(_FilesPlanningModel instance) =>
    <String, dynamic>{
      'from': instance.from,
      'days': instance.days,
      'timezone': instance.timezone,
      'today': instance.today,
      'capacity': instance.capacity,
      'files': instance.files,
      'load': instance.load,
      'alerts': instance.alerts,
    };

_KeptFileModel _$KeptFileModelFromJson(Map<String, dynamic> json) =>
    _KeptFileModel(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String?,
      capacity: (json['capacity'] as num).toInt(),
      active: json['active'] as bool? ?? true,
      plannedDay: json['plannedDay'] as String?,
      keptByHand: json['keptByHand'] as bool? ?? false,
    );

Map<String, dynamic> _$KeptFileModelToJson(_KeptFileModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'name': instance.name,
      'capacity': instance.capacity,
      'active': instance.active,
      'plannedDay': instance.plannedDay,
      'keptByHand': instance.keptByHand,
    };

_KeptFileResponse _$KeptFileResponseFromJson(Map<String, dynamic> json) =>
    _KeptFileResponse(
      data: KeptFileModel.fromJson(json['data'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$KeptFileResponseToJson(_KeptFileResponse instance) =>
    <String, dynamic>{'data': instance.data};

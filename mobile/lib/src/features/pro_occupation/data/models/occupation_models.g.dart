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
      carLat: (json['carLat'] as num?)?.toDouble(),
      carLng: (json['carLng'] as num?)?.toDouble(),
      carAccuracyM: (json['carAccuracyM'] as num?)?.toInt(),
      carLocatedAt: json['carLocatedAt'] == null
          ? null
          : DateTime.parse(json['carLocatedAt'] as String),
      carLocatedBy: json['carLocatedBy'] as String?,
      carNote: json['carNote'] as String?,
      onSite: json['onSite'] as bool? ?? false,
      leavesToday: json['leavesToday'] as bool? ?? false,
      nights: (json['nights'] as num?)?.toInt(),
      stayClass: json['stayClass'] as String?,
      spot: json['spot'] == null
          ? null
          : SpotRefModel.fromJson(json['spot'] as Map<String, dynamic>),
      suggestions:
          (json['suggestions'] as List<dynamic>?)
              ?.map((e) => SuggestionModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      file: json['file'] == null
          ? null
          : FileRefModel.fromJson(json['file'] as Map<String, dynamic>),
      filePosition: (json['filePosition'] as num?)?.toInt(),
      position: (json['position'] as num?)?.toInt(),
      blockedBy:
          (json['blockedBy'] as List<dynamic>?)
              ?.map((e) => FileBlockerModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <FileBlockerModel>[],
      choices:
          (json['choices'] as List<dynamic>?)
              ?.map((e) => FileChoiceModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <FileChoiceModel>[],
      suggested: json['suggested'] == null
          ? null
          : FileChoiceModel.fromJson(json['suggested'] as Map<String, dynamic>),
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
      'carLat': instance.carLat,
      'carLng': instance.carLng,
      'carAccuracyM': instance.carAccuracyM,
      'carLocatedAt': instance.carLocatedAt?.toIso8601String(),
      'carLocatedBy': instance.carLocatedBy,
      'carNote': instance.carNote,
      'onSite': instance.onSite,
      'leavesToday': instance.leavesToday,
      'nights': instance.nights,
      'stayClass': instance.stayClass,
      'spot': instance.spot,
      'suggestions': instance.suggestions,
      'file': instance.file,
      'filePosition': instance.filePosition,
      'position': instance.position,
      'blockedBy': instance.blockedBy,
      'choices': instance.choices,
      'suggested': instance.suggested,
    };

_SpotRefModel _$SpotRefModelFromJson(Map<String, dynamic> json) =>
    _SpotRefModel(code: json['code'] as String);

Map<String, dynamic> _$SpotRefModelToJson(_SpotRefModel instance) =>
    <String, dynamic>{'code': instance.code};

_BlockerModel _$BlockerModelFromJson(Map<String, dynamic> json) =>
    _BlockerModel(
      reservationId: json['reservationId'] as String,
      reference: json['reference'] as String,
      spotCode: json['spotCode'] as String,
      returnAt: DateTime.parse(json['returnAt'] as String),
    );

Map<String, dynamic> _$BlockerModelToJson(_BlockerModel instance) =>
    <String, dynamic>{
      'reservationId': instance.reservationId,
      'reference': instance.reference,
      'spotCode': instance.spotCode,
      'returnAt': instance.returnAt.toIso8601String(),
    };

_SuggestionModel _$SuggestionModelFromJson(Map<String, dynamic> json) =>
    _SuggestionModel(
      spotId: json['spotId'] as String,
      code: json['code'] as String,
      distanceM: (json['distanceM'] as num?)?.toInt(),
      reason: json['reason'] as String,
      stayClass: json['stayClass'] as String?,
      moves: (json['moves'] as num?)?.toInt() ?? 0,
      blocking:
          (json['blocking'] as List<dynamic>?)
              ?.map((e) => BlockerModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <BlockerModel>[],
      blocked:
          (json['blocked'] as List<dynamic>?)
              ?.map((e) => BlockerModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <BlockerModel>[],
    );

Map<String, dynamic> _$SuggestionModelToJson(_SuggestionModel instance) =>
    <String, dynamic>{
      'spotId': instance.spotId,
      'code': instance.code,
      'distanceM': instance.distanceM,
      'reason': instance.reason,
      'stayClass': instance.stayClass,
      'moves': instance.moves,
      'blocking': instance.blocking,
      'blocked': instance.blocked,
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
      stayClass: json['stayClass'] as String?,
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
      'stayClass': instance.stayClass,
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

_FileRefModel _$FileRefModelFromJson(Map<String, dynamic> json) =>
    _FileRefModel(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String?,
    );

Map<String, dynamic> _$FileRefModelToJson(_FileRefModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'name': instance.name,
    };

_FileBlockerModel _$FileBlockerModelFromJson(Map<String, dynamic> json) =>
    _FileBlockerModel(
      reservationId: json['reservationId'] as String,
      reference: json['reference'] as String,
      plate: json['plate'] as String,
      returnAt: json['returnAt'] as String,
    );

Map<String, dynamic> _$FileBlockerModelToJson(_FileBlockerModel instance) =>
    <String, dynamic>{
      'reservationId': instance.reservationId,
      'reference': instance.reference,
      'plate': instance.plate,
      'returnAt': instance.returnAt,
    };

_FileChoiceModel _$FileChoiceModelFromJson(Map<String, dynamic> json) =>
    _FileChoiceModel(
      fileId: json['fileId'] as String,
      code: json['code'] as String,
      reason: json['reason'] as String,
      moves: (json['moves'] as num?)?.toInt() ?? 0,
      cars: (json['cars'] as num?)?.toInt() ?? 0,
      capacity: (json['capacity'] as num?)?.toInt() ?? 0,
      fitMinutes: (json['fitMinutes'] as num?)?.toInt(),
    );

Map<String, dynamic> _$FileChoiceModelToJson(_FileChoiceModel instance) =>
    <String, dynamic>{
      'fileId': instance.fileId,
      'code': instance.code,
      'reason': instance.reason,
      'moves': instance.moves,
      'cars': instance.cars,
      'capacity': instance.capacity,
      'fitMinutes': instance.fitMinutes,
    };

_FileViewModel _$FileViewModelFromJson(Map<String, dynamic> json) =>
    _FileViewModel(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String?,
      capacity: (json['capacity'] as num).toInt(),
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      active: json['active'] as bool? ?? true,
      plannedDay: json['plannedDay'] as String?,
      day: json['day'] as String?,
      cars:
          (json['cars'] as List<dynamic>?)
              ?.map((e) => OccupantModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <OccupantModel>[],
      movesToday: (json['movesToday'] as num?)?.toInt() ?? 0,
      sound: json['sound'] as bool? ?? true,
    );

Map<String, dynamic> _$FileViewModelToJson(_FileViewModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'name': instance.name,
      'capacity': instance.capacity,
      'sortOrder': instance.sortOrder,
      'active': instance.active,
      'plannedDay': instance.plannedDay,
      'day': instance.day,
      'cars': instance.cars,
      'movesToday': instance.movesToday,
      'sound': instance.sound,
    };

_FileStatsModel _$FileStatsModelFromJson(Map<String, dynamic> json) =>
    _FileStatsModel(
      files: (json['files'] as num?)?.toInt() ?? 0,
      capacity: (json['capacity'] as num?)?.toInt() ?? 0,
      cars: (json['cars'] as num?)?.toInt() ?? 0,
      onSite: (json['onSite'] as num?)?.toInt() ?? 0,
      leavingToday: (json['leavingToday'] as num?)?.toInt() ?? 0,
      movesToday: (json['movesToday'] as num?)?.toInt() ?? 0,
      unsound: (json['unsound'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$FileStatsModelToJson(_FileStatsModel instance) =>
    <String, dynamic>{
      'files': instance.files,
      'capacity': instance.capacity,
      'cars': instance.cars,
      'onSite': instance.onSite,
      'leavingToday': instance.leavingToday,
      'movesToday': instance.movesToday,
      'unsound': instance.unsound,
    };

_FileBoardModel _$FileBoardModelFromJson(Map<String, dynamic> json) =>
    _FileBoardModel(
      date: json['date'] as String,
      files:
          (json['files'] as List<dynamic>?)
              ?.map((e) => FileViewModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <FileViewModel>[],
      arrivals:
          (json['arrivals'] as List<dynamic>?)
              ?.map((e) => OccupantModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <OccupantModel>[],
      stats: json['stats'] == null
          ? const FileStatsModel()
          : FileStatsModel.fromJson(json['stats'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$FileBoardModelToJson(_FileBoardModel instance) =>
    <String, dynamic>{
      'date': instance.date,
      'files': instance.files,
      'arrivals': instance.arrivals,
      'stats': instance.stats,
    };

_FilesPreparedModel _$FilesPreparedModelFromJson(Map<String, dynamic> json) =>
    _FilesPreparedModel(
      planned: (json['planned'] as num?)?.toInt() ?? 0,
      free: (json['free'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$FilesPreparedModelToJson(_FilesPreparedModel instance) =>
    <String, dynamic>{'planned': instance.planned, 'free': instance.free};

_FilesPreparedResponse _$FilesPreparedResponseFromJson(
  Map<String, dynamic> json,
) => _FilesPreparedResponse(
  data: FilesPreparedModel.fromJson(json['data'] as Map<String, dynamic>),
);

Map<String, dynamic> _$FilesPreparedResponseToJson(
  _FilesPreparedResponse instance,
) => <String, dynamic>{'data': instance.data};

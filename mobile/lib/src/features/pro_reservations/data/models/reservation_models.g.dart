// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reservation_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ReservationModel _$ReservationModelFromJson(Map<String, dynamic> json) =>
    _ReservationModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      channel: json['channel'] as String,
      channelDetail: json['channelDetail'] as String?,
      status: json['status'] as String,
      arrivalAt: DateTime.parse(json['arrivalAt'] as String),
      returnAt: DateTime.parse(json['returnAt'] as String),
      passengers: (json['passengers'] as num).toInt(),
      customerName: json['customerName'] as String,
      customerFirstName: json['customerFirstName'] as String? ?? '',
      customerLastName: json['customerLastName'] as String? ?? '',
      customerPhone: json['customerPhone'] as String,
      customerEmail: json['customerEmail'] as String?,
      plate: json['plate'] as String,
      returnFlight: json['returnFlight'] as String?,
      departureFlight: json['departureFlight'] as String?,
      departureStatus: json['departureStatus'] as String?,
      departureScheduledAt: json['departureScheduledAt'] == null
          ? null
          : DateTime.parse(json['departureScheduledAt'] as String),
      departureEstimatedAt: json['departureEstimatedAt'] == null
          ? null
          : DateTime.parse(json['departureEstimatedAt'] as String),
      notes: json['notes'] as String?,
      customerNote: json['customerNote'] as String?,
      vehicleModel: json['vehicleModel'] as String?,
      vehicleColour: json['vehicleColour'] as String?,
      returnNoticeKind: json['returnNoticeKind'] as String?,
      returnNoticeText: json['returnNoticeText'] as String?,
      returnNoticeAt: json['returnNoticeAt'] == null
          ? null
          : DateTime.parse(json['returnNoticeAt'] as String),
      externalReference: json['externalReference'] as String?,
      priceCents: (json['priceCents'] as num?)?.toInt(),
      overbooked: json['overbooked'] as bool? ?? false,
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
      paymentStatus: json['paymentStatus'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      nextStatuses:
          (json['nextStatuses'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      spot: json['spot'] == null
          ? null
          : ReservationSpotModel.fromJson(json['spot'] as Map<String, dynamic>),
      file: json['file'] == null
          ? null
          : ReservationFileModel.fromJson(json['file'] as Map<String, dynamic>),
      filePosition: (json['filePosition'] as num?)?.toInt(),
    );

Map<String, dynamic> _$ReservationModelToJson(_ReservationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'reference': instance.reference,
      'channel': instance.channel,
      'channelDetail': instance.channelDetail,
      'status': instance.status,
      'arrivalAt': instance.arrivalAt.toIso8601String(),
      'returnAt': instance.returnAt.toIso8601String(),
      'passengers': instance.passengers,
      'customerName': instance.customerName,
      'customerFirstName': instance.customerFirstName,
      'customerLastName': instance.customerLastName,
      'customerPhone': instance.customerPhone,
      'customerEmail': instance.customerEmail,
      'plate': instance.plate,
      'returnFlight': instance.returnFlight,
      'departureFlight': instance.departureFlight,
      'departureStatus': instance.departureStatus,
      'departureScheduledAt': instance.departureScheduledAt?.toIso8601String(),
      'departureEstimatedAt': instance.departureEstimatedAt?.toIso8601String(),
      'notes': instance.notes,
      'customerNote': instance.customerNote,
      'vehicleModel': instance.vehicleModel,
      'vehicleColour': instance.vehicleColour,
      'returnNoticeKind': instance.returnNoticeKind,
      'returnNoticeText': instance.returnNoticeText,
      'returnNoticeAt': instance.returnNoticeAt?.toIso8601String(),
      'externalReference': instance.externalReference,
      'priceCents': instance.priceCents,
      'overbooked': instance.overbooked,
      'spotId': instance.spotId,
      'keyHook': instance.keyHook,
      'carLat': instance.carLat,
      'carLng': instance.carLng,
      'carAccuracyM': instance.carAccuracyM,
      'carLocatedAt': instance.carLocatedAt?.toIso8601String(),
      'carLocatedBy': instance.carLocatedBy,
      'carNote': instance.carNote,
      'paymentStatus': instance.paymentStatus,
      'createdAt': instance.createdAt?.toIso8601String(),
      'nextStatuses': instance.nextStatuses,
      'spot': instance.spot,
      'file': instance.file,
      'filePosition': instance.filePosition,
    };

_ReservationSpotModel _$ReservationSpotModelFromJson(
  Map<String, dynamic> json,
) => _ReservationSpotModel(code: json['code'] as String);

Map<String, dynamic> _$ReservationSpotModelToJson(
  _ReservationSpotModel instance,
) => <String, dynamic>{'code': instance.code};

_ReservationPageModel _$ReservationPageModelFromJson(
  Map<String, dynamic> json,
) => _ReservationPageModel(
  docs:
      (json['docs'] as List<dynamic>?)
          ?.map((e) => ReservationModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  totalDocs: (json['totalDocs'] as num?)?.toInt() ?? 0,
  page: (json['page'] as num?)?.toInt() ?? 1,
  totalPages: (json['totalPages'] as num?)?.toInt() ?? 1,
  hasNextPage: json['hasNextPage'] as bool? ?? false,
);

Map<String, dynamic> _$ReservationPageModelToJson(
  _ReservationPageModel instance,
) => <String, dynamic>{
  'docs': instance.docs,
  'totalDocs': instance.totalDocs,
  'page': instance.page,
  'totalPages': instance.totalPages,
  'hasNextPage': instance.hasNextPage,
};

_CapacityPreviewModel _$CapacityPreviewModelFromJson(
  Map<String, dynamic> json,
) => _CapacityPreviewModel(
  nights: (json['nights'] as num?)?.toInt() ?? 0,
  fullNights:
      (json['fullNights'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  canForce: json['canForce'] as bool? ?? false,
);

Map<String, dynamic> _$CapacityPreviewModelToJson(
  _CapacityPreviewModel instance,
) => <String, dynamic>{
  'nights': instance.nights,
  'fullNights': instance.fullNights,
  'canForce': instance.canForce,
};

_ReservationInput _$ReservationInputFromJson(Map<String, dynamic> json) =>
    _ReservationInput(
      channel: json['channel'] as String? ?? 'phone',
      channelDetail: json['channelDetail'] as String?,
      arrivalAt: json['arrivalAt'] as String,
      returnAt: json['returnAt'] as String,
      passengers: (json['passengers'] as num?)?.toInt() ?? 2,
      customerFirstName: json['customerFirstName'] as String? ?? '',
      customerLastName: json['customerLastName'] as String? ?? '',
      customerPhone: json['customerPhone'] as String? ?? '',
      customerEmail: json['customerEmail'] as String?,
      plate: json['plate'] as String? ?? '',
      returnFlight: json['returnFlight'] as String?,
      departureFlight: json['departureFlight'] as String?,
      notes: json['notes'] as String?,
      customerNote: json['customerNote'] as String?,
      vehicleModel: json['vehicleModel'] as String?,
      vehicleColour: json['vehicleColour'] as String?,
      externalReference: json['externalReference'] as String?,
      priceCents: (json['priceCents'] as num?)?.toInt(),
      force: json['force'] as bool? ?? false,
    );

Map<String, dynamic> _$ReservationInputToJson(_ReservationInput instance) =>
    <String, dynamic>{
      'channel': instance.channel,
      'channelDetail': instance.channelDetail,
      'arrivalAt': instance.arrivalAt,
      'returnAt': instance.returnAt,
      'passengers': instance.passengers,
      'customerFirstName': instance.customerFirstName,
      'customerLastName': instance.customerLastName,
      'customerPhone': instance.customerPhone,
      'customerEmail': instance.customerEmail,
      'plate': instance.plate,
      'returnFlight': instance.returnFlight,
      'departureFlight': instance.departureFlight,
      'notes': instance.notes,
      'customerNote': instance.customerNote,
      'vehicleModel': instance.vehicleModel,
      'vehicleColour': instance.vehicleColour,
      'externalReference': instance.externalReference,
      'priceCents': instance.priceCents,
      'force': instance.force,
    };

_ReservationFileModel _$ReservationFileModelFromJson(
  Map<String, dynamic> json,
) => _ReservationFileModel(
  id: json['id'] as String,
  code: json['code'] as String,
  name: json['name'] as String?,
);

Map<String, dynamic> _$ReservationFileModelToJson(
  _ReservationFileModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'code': instance.code,
  'name': instance.name,
};

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reservation_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ReservationModel _$ReservationModelFromJson(Map<String, dynamic> json) => _ReservationModel(
  id: json['id'] as String,
  reference: json['reference'] as String,
  channel: json['channel'] as String,
  channelDetail: json['channelDetail'] as String?,
  status: json['status'] as String,
  arrivalAt: DateTime.parse(json['arrivalAt'] as String),
  returnAt: DateTime.parse(json['returnAt'] as String),
  passengers: (json['passengers'] as num).toInt(),
  customerName: json['customerName'] as String,
  customerPhone: json['customerPhone'] as String,
  customerEmail: json['customerEmail'] as String?,
  plate: json['plate'] as String,
  returnFlight: json['returnFlight'] as String?,
  notes: json['notes'] as String?,
  externalReference: json['externalReference'] as String?,
  priceCents: (json['priceCents'] as num?)?.toInt(),
  overbooked: json['overbooked'] as bool? ?? false,
  spotId: json['spotId'] as String?,
  keyHook: json['keyHook'] as String?,
  paymentStatus: json['paymentStatus'] as String?,
  createdAt: json['createdAt'] == null ? null : DateTime.parse(json['createdAt'] as String),
  spot: json['spot'] == null ? null : ReservationSpotModel.fromJson(json['spot'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ReservationModelToJson(_ReservationModel instance) => <String, dynamic>{
  'id': instance.id,
  'reference': instance.reference,
  'channel': instance.channel,
  'channelDetail': instance.channelDetail,
  'status': instance.status,
  'arrivalAt': instance.arrivalAt.toIso8601String(),
  'returnAt': instance.returnAt.toIso8601String(),
  'passengers': instance.passengers,
  'customerName': instance.customerName,
  'customerPhone': instance.customerPhone,
  'customerEmail': instance.customerEmail,
  'plate': instance.plate,
  'returnFlight': instance.returnFlight,
  'notes': instance.notes,
  'externalReference': instance.externalReference,
  'priceCents': instance.priceCents,
  'overbooked': instance.overbooked,
  'spotId': instance.spotId,
  'keyHook': instance.keyHook,
  'paymentStatus': instance.paymentStatus,
  'createdAt': instance.createdAt?.toIso8601String(),
  'spot': instance.spot,
};

_ReservationSpotModel _$ReservationSpotModelFromJson(Map<String, dynamic> json) => _ReservationSpotModel(code: json['code'] as String);

Map<String, dynamic> _$ReservationSpotModelToJson(_ReservationSpotModel instance) => <String, dynamic>{'code': instance.code};

_ReservationPageModel _$ReservationPageModelFromJson(Map<String, dynamic> json) => _ReservationPageModel(
  docs: (json['docs'] as List<dynamic>?)?.map((e) => ReservationModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  totalDocs: (json['totalDocs'] as num?)?.toInt() ?? 0,
  page: (json['page'] as num?)?.toInt() ?? 1,
  totalPages: (json['totalPages'] as num?)?.toInt() ?? 1,
  hasNextPage: json['hasNextPage'] as bool? ?? false,
);

Map<String, dynamic> _$ReservationPageModelToJson(_ReservationPageModel instance) => <String, dynamic>{
  'docs': instance.docs,
  'totalDocs': instance.totalDocs,
  'page': instance.page,
  'totalPages': instance.totalPages,
  'hasNextPage': instance.hasNextPage,
};

_CapacityPreviewModel _$CapacityPreviewModelFromJson(Map<String, dynamic> json) => _CapacityPreviewModel(
  nights: (json['nights'] as num?)?.toInt() ?? 0,
  fullNights: (json['fullNights'] as List<dynamic>?)?.map((e) => e as String).toList() ?? const [],
  canForce: json['canForce'] as bool? ?? false,
);

Map<String, dynamic> _$CapacityPreviewModelToJson(_CapacityPreviewModel instance) => <String, dynamic>{
  'nights': instance.nights,
  'fullNights': instance.fullNights,
  'canForce': instance.canForce,
};

_ParsedBookingModel _$ParsedBookingModelFromJson(Map<String, dynamic> json) => _ParsedBookingModel(
  provider: json['provider'] as String,
  externalReference: json['externalReference'] as String?,
  arrivalAt: json['arrivalAt'] as String?,
  returnAt: json['returnAt'] as String?,
  customerName: json['customerName'] as String?,
  customerPhone: json['customerPhone'] as String?,
  customerEmail: json['customerEmail'] as String?,
  plate: json['plate'] as String?,
  returnFlight: json['returnFlight'] as String?,
  passengers: (json['passengers'] as num?)?.toInt(),
  priceCents: (json['priceCents'] as num?)?.toInt(),
);

Map<String, dynamic> _$ParsedBookingModelToJson(_ParsedBookingModel instance) => <String, dynamic>{
  'provider': instance.provider,
  'externalReference': instance.externalReference,
  'arrivalAt': instance.arrivalAt,
  'returnAt': instance.returnAt,
  'customerName': instance.customerName,
  'customerPhone': instance.customerPhone,
  'customerEmail': instance.customerEmail,
  'plate': instance.plate,
  'returnFlight': instance.returnFlight,
  'passengers': instance.passengers,
  'priceCents': instance.priceCents,
};

_DuplicateRefModel _$DuplicateRefModelFromJson(Map<String, dynamic> json) =>
    _DuplicateRefModel(id: json['id'] as String, reference: json['reference'] as String);

Map<String, dynamic> _$DuplicateRefModelToJson(_DuplicateRefModel instance) => <String, dynamic>{'id': instance.id, 'reference': instance.reference};

_ParsedEmailModel _$ParsedEmailModelFromJson(Map<String, dynamic> json) => _ParsedEmailModel(
  parsed: ParsedBookingModel.fromJson(json['parsed'] as Map<String, dynamic>),
  missing: (json['missing'] as List<dynamic>?)?.map((e) => e as String).toList() ?? const [],
  duplicate: json['duplicate'] == null ? null : DuplicateRefModel.fromJson(json['duplicate'] as Map<String, dynamic>),
  capacity: json['capacity'] == null ? null : CapacityPreviewModel.fromJson(json['capacity'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ParsedEmailModelToJson(_ParsedEmailModel instance) => <String, dynamic>{
  'parsed': instance.parsed,
  'missing': instance.missing,
  'duplicate': instance.duplicate,
  'capacity': instance.capacity,
};

_ReservationInput _$ReservationInputFromJson(Map<String, dynamic> json) => _ReservationInput(
  channel: json['channel'] as String? ?? 'phone',
  channelDetail: json['channelDetail'] as String?,
  arrivalAt: json['arrivalAt'] as String,
  returnAt: json['returnAt'] as String,
  passengers: (json['passengers'] as num?)?.toInt() ?? 2,
  customerName: json['customerName'] as String? ?? '',
  customerPhone: json['customerPhone'] as String? ?? '',
  customerEmail: json['customerEmail'] as String?,
  plate: json['plate'] as String? ?? '',
  returnFlight: json['returnFlight'] as String?,
  notes: json['notes'] as String?,
  externalReference: json['externalReference'] as String?,
  priceCents: (json['priceCents'] as num?)?.toInt(),
  force: json['force'] as bool? ?? false,
);

Map<String, dynamic> _$ReservationInputToJson(_ReservationInput instance) => <String, dynamic>{
  'channel': instance.channel,
  'channelDetail': instance.channelDetail,
  'arrivalAt': instance.arrivalAt,
  'returnAt': instance.returnAt,
  'passengers': instance.passengers,
  'customerName': instance.customerName,
  'customerPhone': instance.customerPhone,
  'customerEmail': instance.customerEmail,
  'plate': instance.plate,
  'returnFlight': instance.returnFlight,
  'notes': instance.notes,
  'externalReference': instance.externalReference,
  'priceCents': instance.priceCents,
  'force': instance.force,
};

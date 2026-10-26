// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'paperwork_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PaperworkModel _$PaperworkModelFromJson(Map<String, dynamic> json) => _PaperworkModel(
  reservationId: json['reservationId'] as String?,
  status: json['status'] as String,
  photosAvailable: json['photosAvailable'] as bool? ?? true,
  contract: ContractModel.fromJson(json['contract'] as Map<String, dynamic>),
  dropoff: json['dropoff'] == null ? null : InspectionModel.fromJson(json['dropoff'] as Map<String, dynamic>),
  returnReport: json['return'] == null ? null : InspectionModel.fromJson(json['return'] as Map<String, dynamic>),
  comparison: json['comparison'] == null ? null : ComparisonModel.fromJson(json['comparison'] as Map<String, dynamic>),
  travellerReports: json['travellerReports'] == null
      ? const TravellerReportsModel()
      : TravellerReportsModel.fromJson(json['travellerReports'] as Map<String, dynamic>),
  travellerCanPhotograph: json['travellerCanPhotograph'] == null ? null : KindFlagsModel.fromJson(json['travellerCanPhotograph'] as Map<String, dynamic>),
);

Map<String, dynamic> _$PaperworkModelToJson(_PaperworkModel instance) => <String, dynamic>{
  'reservationId': instance.reservationId,
  'status': instance.status,
  'photosAvailable': instance.photosAvailable,
  'contract': instance.contract,
  'dropoff': instance.dropoff,
  'return': instance.returnReport,
  'comparison': instance.comparison,
  'travellerReports': instance.travellerReports,
  'travellerCanPhotograph': instance.travellerCanPhotograph,
};

_TravellerReportsModel _$TravellerReportsModelFromJson(Map<String, dynamic> json) => _TravellerReportsModel(
  dropoff: json['dropoff'] == null ? null : InspectionModel.fromJson(json['dropoff'] as Map<String, dynamic>),
  returnReport: json['return'] == null ? null : InspectionModel.fromJson(json['return'] as Map<String, dynamic>),
);

Map<String, dynamic> _$TravellerReportsModelToJson(_TravellerReportsModel instance) => <String, dynamic>{
  'dropoff': instance.dropoff,
  'return': instance.returnReport,
};

_KindFlagsModel _$KindFlagsModelFromJson(Map<String, dynamic> json) =>
    _KindFlagsModel(dropoff: json['dropoff'] as bool? ?? false, returnReport: json['return'] as bool? ?? false);

Map<String, dynamic> _$KindFlagsModelToJson(_KindFlagsModel instance) => <String, dynamic>{'dropoff': instance.dropoff, 'return': instance.returnReport};

_ContractModel _$ContractModelFromJson(Map<String, dynamic> json) => _ContractModel(
  status: json['status'] as String,
  canSign: json['canSign'] as bool? ?? false,
  atCounter: json['atCounter'] as bool? ?? false,
  codeAvailable: json['codeAvailable'] as bool? ?? false,
  phoneMasked: json['phoneMasked'] as String,
  document: ContractDocumentModel.fromJson(json['document'] as Map<String, dynamic>),
  signed: json['signed'] == null ? null : SignedContractModel.fromJson(json['signed'] as Map<String, dynamic>),
  template: json['template'] == null ? null : ContractTemplateInfo.fromJson(json['template'] as Map<String, dynamic>),
  files: json['files'] == null ? const ContractFiles() : ContractFiles.fromJson(json['files'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ContractModelToJson(_ContractModel instance) => <String, dynamic>{
  'status': instance.status,
  'canSign': instance.canSign,
  'atCounter': instance.atCounter,
  'codeAvailable': instance.codeAvailable,
  'phoneMasked': instance.phoneMasked,
  'document': instance.document,
  'signed': instance.signed,
  'template': instance.template,
  'files': instance.files,
};

_ContractDocumentModel _$ContractDocumentModelFromJson(Map<String, dynamic> json) => _ContractDocumentModel(
  title: json['title'] as String,
  summary: (json['summary'] as List<dynamic>?)?.map((e) => e as String).toList() ?? const [],
  clauses: (json['clauses'] as List<dynamic>?)?.map((e) => e as String).toList() ?? const [],
);

Map<String, dynamic> _$ContractDocumentModelToJson(_ContractDocumentModel instance) => <String, dynamic>{
  'title': instance.title,
  'summary': instance.summary,
  'clauses': instance.clauses,
};

_SignedContractModel _$SignedContractModelFromJson(Map<String, dynamic> json) => _SignedContractModel(
  version: json['version'] as String,
  signedAt: DateTime.parse(json['signedAt'] as String),
  signerName: json['signerName'] as String,
  method: json['method'] as String,
  device: json['device'] as String,
  phoneMasked: json['phoneMasked'] as String?,
  proofSha256: json['proofSha256'] as String,
);

Map<String, dynamic> _$SignedContractModelToJson(_SignedContractModel instance) => <String, dynamic>{
  'version': instance.version,
  'signedAt': instance.signedAt.toIso8601String(),
  'signerName': instance.signerName,
  'method': instance.method,
  'device': instance.device,
  'phoneMasked': instance.phoneMasked,
  'proofSha256': instance.proofSha256,
};

_DamageModel _$DamageModelFromJson(Map<String, dynamic> json) => _DamageModel(
  n: (json['n'] as num?)?.toInt() ?? 0,
  x: (json['x'] as num).toDouble(),
  y: (json['y'] as num).toDouble(),
  label: json['label'] as String,
  photoId: json['photoId'] as String?,
);

Map<String, dynamic> _$DamageModelToJson(_DamageModel instance) => <String, dynamic>{
  'n': instance.n,
  'x': instance.x,
  'y': instance.y,
  'label': instance.label,
  'photoId': instance.photoId,
};

_InspectionPhotoModel _$InspectionPhotoModelFromJson(Map<String, dynamic> json) =>
    _InspectionPhotoModel(id: json['id'] as String, slot: json['slot'] as String, takenAt: DateTime.parse(json['takenAt'] as String));

Map<String, dynamic> _$InspectionPhotoModelToJson(_InspectionPhotoModel instance) => <String, dynamic>{
  'id': instance.id,
  'slot': instance.slot,
  'takenAt': instance.takenAt.toIso8601String(),
};

_InspectionModel _$InspectionModelFromJson(Map<String, dynamic> json) => _InspectionModel(
  kind: json['kind'] as String,
  startedAt: DateTime.parse(json['startedAt'] as String),
  completedAt: json['completedAt'] == null ? null : DateTime.parse(json['completedAt'] as String),
  performedBy: json['performedBy'] as String?,
  damages: (json['damages'] as List<dynamic>?)?.map((e) => DamageModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  mileageKm: (json['mileageKm'] as num?)?.toInt(),
  fuelQuarters: (json['fuelQuarters'] as num?)?.toInt(),
  notes: json['notes'] as String?,
  photos: (json['photos'] as List<dynamic>?)?.map((e) => InspectionPhotoModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  photosErased: json['photosErased'] as bool? ?? false,
  missing: (json['missing'] as List<dynamic>?)?.map((e) => e as String).toList() ?? const [],
  editable: json['editable'] as bool? ?? false,
  decision: json['decision'] as String? ?? 'pending',
  decidedAt: json['decidedAt'] == null ? null : DateTime.parse(json['decidedAt'] as String),
  decisionMethod: json['decisionMethod'] as String?,
  decisionDevice: json['decisionDevice'] as String?,
  reserveText: json['reserveText'] as String?,
  canAnswer: json['canAnswer'] as bool? ?? false,
);

Map<String, dynamic> _$InspectionModelToJson(_InspectionModel instance) => <String, dynamic>{
  'kind': instance.kind,
  'startedAt': instance.startedAt.toIso8601String(),
  'completedAt': instance.completedAt?.toIso8601String(),
  'performedBy': instance.performedBy,
  'damages': instance.damages,
  'mileageKm': instance.mileageKm,
  'fuelQuarters': instance.fuelQuarters,
  'notes': instance.notes,
  'photos': instance.photos,
  'photosErased': instance.photosErased,
  'missing': instance.missing,
  'editable': instance.editable,
  'decision': instance.decision,
  'decidedAt': instance.decidedAt?.toIso8601String(),
  'decisionMethod': instance.decisionMethod,
  'decisionDevice': instance.decisionDevice,
  'reserveText': instance.reserveText,
  'canAnswer': instance.canAnswer,
};

_ComparisonModel _$ComparisonModelFromJson(Map<String, dynamic> json) => _ComparisonModel(
  before: (json['before'] as List<dynamic>?)?.map((e) => DamageModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  after: (json['after'] as List<dynamic>?)?.map((e) => DamageModel.fromJson(e as Map<String, dynamic>)).toList() ?? const [],
  mileageDeltaKm: (json['mileageDeltaKm'] as num?)?.toInt(),
  fuelDeltaQuarters: (json['fuelDeltaQuarters'] as num?)?.toInt(),
);

Map<String, dynamic> _$ComparisonModelToJson(_ComparisonModel instance) => <String, dynamic>{
  'before': instance.before,
  'after': instance.after,
  'mileageDeltaKm': instance.mileageDeltaKm,
  'fuelDeltaQuarters': instance.fuelDeltaQuarters,
};

_CodeSentModel _$CodeSentModelFromJson(Map<String, dynamic> json) => _CodeSentModel(
  sentTo: json['sentTo'] as String,
  expiresAt: DateTime.parse(json['expiresAt'] as String),
  resendAfterSeconds: (json['resendAfterSeconds'] as num?)?.toInt() ?? 60,
);

Map<String, dynamic> _$CodeSentModelToJson(_CodeSentModel instance) => <String, dynamic>{
  'sentTo': instance.sentTo,
  'expiresAt': instance.expiresAt.toIso8601String(),
  'resendAfterSeconds': instance.resendAfterSeconds,
};

_AddedPhotoModel _$AddedPhotoModelFromJson(Map<String, dynamic> json) =>
    _AddedPhotoModel(photoId: json['photoId'] as String, paperwork: PaperworkModel.fromJson(json['paperwork'] as Map<String, dynamic>));

Map<String, dynamic> _$AddedPhotoModelToJson(_AddedPhotoModel instance) => <String, dynamic>{'photoId': instance.photoId, 'paperwork': instance.paperwork};

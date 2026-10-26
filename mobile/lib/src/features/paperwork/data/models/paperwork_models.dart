import 'package:freezed_annotation/freezed_annotation.dart';

part 'paperwork_models.freezed.dart';
part 'paperwork_models.g.dart';

/// « Contrat signé et état des lieux » (19/10/2026): what the API returns for a booking, to the staff
/// (`GET /internal/reservations/:id/paperwork`) or to the traveller (`GET /public/bookings/:ref/paperwork`).
@freezed
abstract class PaperworkModel with _$PaperworkModel {
  const PaperworkModel._();

  const factory PaperworkModel({
    String? reservationId,
    required String status,

    /// False while no photo store is connected on the server (photos cannot be taken).
    @Default(true) bool photosAvailable,
    required ContractModel contract,
    InspectionModel? dropoff,
    @JsonKey(name: 'return') InspectionModel? returnReport,
    ComparisonModel? comparison,

    /// The traveller's own photos (20/10/2026): theirs while they take them, the staff's once sent.
    @Default(TravellerReportsModel()) TravellerReportsModel travellerReports,

    /// To the traveller only: whether they may still take their photos of this kind.
    KindFlagsModel? travellerCanPhotograph,
  }) = _PaperworkModel;

  factory PaperworkModel.fromJson(Map<String, dynamic> json) => _$PaperworkModelFromJson(json);

  InspectionModel? report(String kind) => kind == 'dropoff' ? dropoff : returnReport;
  InspectionModel? ownReport(String kind) => kind == 'dropoff' ? travellerReports.dropoff : travellerReports.returnReport;
  bool canPhotograph(String kind) => (kind == 'dropoff' ? travellerCanPhotograph?.dropoff : travellerCanPhotograph?.returnReport) ?? false;
}

@freezed
abstract class TravellerReportsModel with _$TravellerReportsModel {
  const factory TravellerReportsModel({InspectionModel? dropoff, @JsonKey(name: 'return') InspectionModel? returnReport}) = _TravellerReportsModel;

  factory TravellerReportsModel.fromJson(Map<String, dynamic> json) => _$TravellerReportsModelFromJson(json);
}

@freezed
abstract class KindFlagsModel with _$KindFlagsModel {
  const factory KindFlagsModel({@Default(false) bool dropoff, @Default(false) @JsonKey(name: 'return') bool returnReport}) = _KindFlagsModel;

  factory KindFlagsModel.fromJson(Map<String, dynamic> json) => _$KindFlagsModelFromJson(json);
}

@freezed
abstract class ContractModel with _$ContractModel {
  const ContractModel._();

  const factory ContractModel({
    /// unsigned | signed
    required String status,

    /// The staff may have it signed now (the contract is signed at the counter, on the parking's phone).
    @Default(false) bool canSign,

    /// Not signed yet and still signable: at the counter, the day of the drop-off.
    @Default(false) bool atCounter,

    /// A code can be sent by SMS (a mobile number, SMS configured on the server).
    @Default(false) bool codeAvailable,
    required String phoneMasked,
    required ContractDocumentModel document,
    SignedContractModel? signed,

    /// The parking's own PDF (26/10/2026): the one signed, or the one in force until the signature.
    ContractTemplateInfo? template,

    /// Which PDFs the API serves: the parking's contract, the signed PDF, the proof.
    @Default(ContractFiles()) ContractFiles files,
  }) = _ContractModel;

  factory ContractModel.fromJson(Map<String, dynamic> json) => _$ContractModelFromJson(json);

  bool get isSigned => status == 'signed';
}

/// The parking's own contract (26/10/2026, « chaque parking peut héberger le contrat de stationnement à ses clients »,
/// choice A « Mon PDF »): read before signing, served by `…/contract/file?kind=template`.
class ContractTemplateInfo {
  const ContractTemplateInfo({required this.id, required this.title, required this.version, required this.pageCount, required this.fileName});

  factory ContractTemplateInfo.fromJson(Map<String, dynamic> json) => ContractTemplateInfo(
    id: json['id'] as String,
    title: json['title'] as String,
    version: (json['version'] as num).toInt(),
    pageCount: (json['pageCount'] as num).toInt(),
    fileName: json['fileName'] as String,
  );

  final String id;
  final String title;
  final int version;
  final int pageCount;
  final String fileName;

  Map<String, dynamic> toJson() => {'id': id, 'title': title, 'version': version, 'pageCount': pageCount, 'fileName': fileName};

  @override
  bool operator ==(Object other) =>
      other is ContractTemplateInfo && other.id == id && other.title == title && other.version == version && other.pageCount == pageCount && other.fileName == fileName;

  @override
  int get hashCode => Object.hash(id, title, version, pageCount, fileName);

  @override
  String toString() => 'ContractTemplateInfo(id: $id, title: $title, version: $version, pageCount: $pageCount, fileName: $fileName)';
}

/// Which contract PDFs the API serves for a booking (`…/contract/file?kind=`).
class ContractFiles {
  const ContractFiles({this.template = false, this.signed = false, this.proof = false});

  factory ContractFiles.fromJson(Map<String, dynamic> json) =>
      ContractFiles(template: json['template'] as bool? ?? false, signed: json['signed'] as bool? ?? false, proof: json['proof'] as bool? ?? false);

  final bool template;
  final bool signed;
  final bool proof;

  Map<String, dynamic> toJson() => {'template': template, 'signed': signed, 'proof': proof};

  @override
  bool operator ==(Object other) => other is ContractFiles && other.template == template && other.signed == signed && other.proof == proof;

  @override
  int get hashCode => Object.hash(template, signed, proof);

  @override
  String toString() => 'ContractFiles(template: $template, signed: $signed, proof: $proof)';
}

@freezed
abstract class ContractDocumentModel with _$ContractDocumentModel {
  const factory ContractDocumentModel({required String title, @Default([]) List<String> summary, @Default([]) List<String> clauses}) = _ContractDocumentModel;

  factory ContractDocumentModel.fromJson(Map<String, dynamic> json) => _$ContractDocumentModelFromJson(json);
}

@freezed
abstract class SignedContractModel with _$SignedContractModel {
  const factory SignedContractModel({
    required String version,
    required DateTime signedAt,
    required String signerName,

    /// sms_code | handwritten
    required String method,

    /// traveller_app | staff_device
    required String device,
    String? phoneMasked,
    required String proofSha256,
  }) = _SignedContractModel;

  factory SignedContractModel.fromJson(Map<String, dynamic> json) => _$SignedContractModelFromJson(json);
}

/// A damage marked on the car's outline: x, y from 0 to 1 (x from the left, y from the front).
@freezed
abstract class DamageModel with _$DamageModel {
  const DamageModel._();

  const factory DamageModel({@Default(0) int n, required double x, required double y, required String label, String? photoId}) = _DamageModel;

  factory DamageModel.fromJson(Map<String, dynamic> json) => _$DamageModelFromJson(json);

  Map<String, dynamic> toBody() => {'x': x, 'y': y, 'label': label, if (photoId != null) 'photoId': photoId};
}

@freezed
abstract class InspectionPhotoModel with _$InspectionPhotoModel {
  const factory InspectionPhotoModel({required String id, required String slot, required DateTime takenAt}) = _InspectionPhotoModel;

  factory InspectionPhotoModel.fromJson(Map<String, dynamic> json) => _$InspectionPhotoModelFromJson(json);
}

@freezed
abstract class InspectionModel with _$InspectionModel {
  const InspectionModel._();

  const factory InspectionModel({
    /// dropoff | return
    required String kind,
    required DateTime startedAt,
    DateTime? completedAt,

    /// First name of the staff member who took it.
    String? performedBy,
    @Default([]) List<DamageModel> damages,
    int? mileageKm,

    /// 0 to 4 quarters of a tank.
    int? fuelQuarters,
    String? notes,
    @Default([]) List<InspectionPhotoModel> photos,
    @Default(false) bool photosErased,

    /// What is still needed to complete it: slots, mileageKm, fuelQuarters.
    @Default([]) List<String> missing,
    @Default(false) bool editable,

    /// pending | accepted | accepted_by_default | reserved
    @Default('pending') String decision,
    DateTime? decidedAt,
    String? decisionMethod,
    String? decisionDevice,
    String? reserveText,
    @Default(false) bool canAnswer,
  }) = _InspectionModel;

  factory InspectionModel.fromJson(Map<String, dynamic> json) => _$InspectionModelFromJson(json);

  bool get completed => completedAt != null;
  InspectionPhotoModel? photoOf(String slot) => photos.where((p) => p.slot == slot).lastOrNull;
  List<InspectionPhotoModel> get damagePhotos => photos.where((p) => p.slot == 'damage').toList();
}

@freezed
abstract class ComparisonModel with _$ComparisonModel {
  const factory ComparisonModel({@Default([]) List<DamageModel> before, @Default([]) List<DamageModel> after, int? mileageDeltaKm, int? fuelDeltaQuarters}) =
      _ComparisonModel;

  factory ComparisonModel.fromJson(Map<String, dynamic> json) => _$ComparisonModelFromJson(json);
}

@freezed
abstract class CodeSentModel with _$CodeSentModel {
  const factory CodeSentModel({required String sentTo, required DateTime expiresAt, @Default(60) int resendAfterSeconds}) = _CodeSentModel;

  factory CodeSentModel.fromJson(Map<String, dynamic> json) => _$CodeSentModelFromJson(json);
}

@freezed
abstract class AddedPhotoModel with _$AddedPhotoModel {
  const factory AddedPhotoModel({required String photoId, required PaperworkModel paperwork}) = _AddedPhotoModel;

  factory AddedPhotoModel.fromJson(Map<String, dynamic> json) => _$AddedPhotoModelFromJson(json);
}

/// The six guided photos, in the order they are asked for.
const inspectionSlots = ['front', 'right', 'back', 'left', 'dashboard', 'interior'];

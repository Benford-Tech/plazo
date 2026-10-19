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
  }) = _PaperworkModel;

  factory PaperworkModel.fromJson(Map<String, dynamic> json) => _$PaperworkModelFromJson(json);

  InspectionModel? report(String kind) => kind == 'dropoff' ? dropoff : returnReport;
}

@freezed
abstract class ContractModel with _$ContractModel {
  const ContractModel._();

  const factory ContractModel({
    /// unsigned | signed
    required String status,
    @Default(false) bool canSign,

    /// A code can be sent by SMS (a mobile number, SMS configured on the server).
    @Default(false) bool codeAvailable,
    required String phoneMasked,
    required ContractDocumentModel document,
    SignedContractModel? signed,
  }) = _ContractModel;

  factory ContractModel.fromJson(Map<String, dynamic> json) => _$ContractModelFromJson(json);

  bool get isSigned => status == 'signed';
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

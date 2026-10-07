import 'package:freezed_annotation/freezed_annotation.dart';

part 'occupation_models.freezed.dart';
part 'occupation_models.g.dart';

/// A booking as the occupation board and the vehicle search return it.
@freezed
abstract class OccupantModel with _$OccupantModel {
  const factory OccupantModel({
    required String id,
    required String reference,
    required String customerName,
    required String plate,
    required String status,
    required String arrivalAt,
    required String returnAt,
    String? returnFlight,
    String? spotId,
    String? keyHook,

    /// Where the car is parked (06/10/2026), when recorded (by the traveller or the staff).
    double? carLat,
    double? carLng,
    int? carAccuracyM,
    DateTime? carLocatedAt,
    String? carLocatedBy,
    String? carNote,
    @Default(false) bool onSite,
    @Default(false) bool leavesToday,

    /// D-B (07/10/2026): nights of the stay and its class (short, medium, long), for the plan by stay.
    int? nights,
    String? stayClass,

    /// Search results carry the spot's code.
    SpotRefModel? spot,

    /// Arrivals to place carry their suggestions.
    @Default([]) List<SuggestionModel> suggestions,

    /// S-C (07/10/2026): the file the car stands in and its position from the aisle (1 = first out).
    FileRefModel? file,
    int? filePosition,
    int? position,

    /// Cars in front that leave later: to take out before this one (file board).
    @Default(<FileBlockerModel>[]) List<FileBlockerModel> blockedBy,

    /// Arrivals of the file board: the ranked files and the one the rule picks.
    @Default(<FileChoiceModel>[]) List<FileChoiceModel> choices,
    FileChoiceModel? suggested,
  }) = _OccupantModel;
  factory OccupantModel.fromJson(Map<String, dynamic> json) => _$OccupantModelFromJson(json);
}

@freezed
abstract class SpotRefModel with _$SpotRefModel {
  const factory SpotRefModel({required String code}) = _SpotRefModel;
  factory SpotRefModel.fromJson(Map<String, dynamic> json) => _$SpotRefModelFromJson(json);
}

/// O-A: a car in the way (in front, leaving later) or blocked (behind, leaving earlier).
@freezed
abstract class BlockerModel with _$BlockerModel {
  const factory BlockerModel({required String reservationId, required String reference, required String spotCode, required DateTime returnAt}) = _BlockerModel;
  factory BlockerModel.fromJson(Map<String, dynamic> json) => _$BlockerModelFromJson(json);
}

@freezed
abstract class SuggestionModel with _$SuggestionModel {
  const factory SuggestionModel({
    required String spotId,
    required String code,
    int? distanceM,
    required String reason,
    String? stayClass,

    /// O-A (06/10/2026): cars to move because of this choice (0: the file stays sound).
    @Default(0) int moves,
    @Default(<BlockerModel>[]) List<BlockerModel> blocking,
    @Default(<BlockerModel>[]) List<BlockerModel> blocked,
  }) = _SuggestionModel;
  factory SuggestionModel.fromJson(Map<String, dynamic> json) => _$SuggestionModelFromJson(json);
}

@freezed
abstract class SpotStateModel with _$SpotStateModel {
  const factory SpotStateModel({
    required String id,
    required String zoneId,
    required String code,
    required int row,
    required int index,
    required String kind,
    required bool active,
    required List<List<double>> geometry,

    /// Z-A: short, medium or long stay zone (valet layouts).
    String? stayClass,
    OccupantModel? occupant,
  }) = _SpotStateModel;
  factory SpotStateModel.fromJson(Map<String, dynamic> json) => _$SpotStateModelFromJson(json);
}

@freezed
abstract class OccupationStatsModel with _$OccupationStatsModel {
  const factory OccupationStatsModel({required int active, required int occupied, required int leavingToday}) = _OccupationStatsModel;
  factory OccupationStatsModel.fromJson(Map<String, dynamic> json) => _$OccupationStatsModelFromJson(json);
}

/// GET /internal/parkings/:id/occupation
@freezed
abstract class OccupationBoardModel with _$OccupationBoardModel {
  const factory OccupationBoardModel({
    required String date,
    @Default([]) List<SpotStateModel> spots,
    @Default([]) List<OccupantModel> arrivals,
    required OccupationStatsModel stats,
  }) = _OccupationBoardModel;
  factory OccupationBoardModel.fromJson(Map<String, dynamic> json) => _$OccupationBoardModelFromJson(json);
}

@freezed
abstract class VehicleSearchModel with _$VehicleSearchModel {
  const factory VehicleSearchModel({@Default([]) List<OccupantModel> results}) = _VehicleSearchModel;
  factory VehicleSearchModel.fromJson(Map<String, dynamic> json) => _$VehicleSearchModelFromJson(json);
}

@freezed
abstract class AssignedModel with _$AssignedModel {
  const factory AssignedModel({required OccupantModel data}) = _AssignedModel;
  factory AssignedModel.fromJson(Map<String, dynamic> json) => _$AssignedModelFromJson(json);
}

// ---- S-C (07/10/2026): files as the unit of storage -------------------------------------------

@freezed
abstract class FileRefModel with _$FileRefModel {
  const factory FileRefModel({required String id, required String code, String? name}) = _FileRefModel;
  factory FileRefModel.fromJson(Map<String, dynamic> json) => _$FileRefModelFromJson(json);
}

@freezed
abstract class FileBlockerModel with _$FileBlockerModel {
  const factory FileBlockerModel({required String reservationId, required String reference, required String plate, required String returnAt}) = _FileBlockerModel;
  factory FileBlockerModel.fromJson(Map<String, dynamic> json) => _$FileBlockerModelFromJson(json);
}

/// A file ranked for an arriving car: planned_day, tight_fit, empty, moves or full.
@freezed
abstract class FileChoiceModel with _$FileChoiceModel {
  const factory FileChoiceModel({
    required String fileId,
    required String code,
    required String reason,
    @Default(0) int moves,
    @Default(0) int cars,
    @Default(0) int capacity,
    int? fitMinutes,
  }) = _FileChoiceModel;
  factory FileChoiceModel.fromJson(Map<String, dynamic> json) => _$FileChoiceModelFromJson(json);
}

/// A file with its stack, from the aisle to the back.
@freezed
abstract class FileViewModel with _$FileViewModel {
  const factory FileViewModel({
    required String id,
    required String code,
    String? name,
    required int capacity,
    @Default(0) int sortOrder,
    @Default(true) bool active,
    String? plannedDay,
    String? day,
    @Default(<OccupantModel>[]) List<OccupantModel> cars,
    @Default(0) int movesToday,
    @Default(true) bool sound,
  }) = _FileViewModel;
  factory FileViewModel.fromJson(Map<String, dynamic> json) => _$FileViewModelFromJson(json);
}

@freezed
abstract class FileStatsModel with _$FileStatsModel {
  const factory FileStatsModel({
    @Default(0) int files,
    @Default(0) int capacity,
    @Default(0) int cars,
    @Default(0) int onSite,
    @Default(0) int leavingToday,
    @Default(0) int movesToday,
    @Default(0) int unsound,
  }) = _FileStatsModel;
  factory FileStatsModel.fromJson(Map<String, dynamic> json) => _$FileStatsModelFromJson(json);
}

/// GET /internal/parkings/:id/files
@freezed
abstract class FileBoardModel with _$FileBoardModel {
  const factory FileBoardModel({
    required String date,
    @Default(<FileViewModel>[]) List<FileViewModel> files,
    @Default(<OccupantModel>[]) List<OccupantModel> arrivals,
    @Default(FileStatsModel()) FileStatsModel stats,
  }) = _FileBoardModel;
  factory FileBoardModel.fromJson(Map<String, dynamic> json) => _$FileBoardModelFromJson(json);
}

@freezed
abstract class FilesPreparedModel with _$FilesPreparedModel {
  const factory FilesPreparedModel({@Default(0) int planned, @Default(0) int free}) = _FilesPreparedModel;
  factory FilesPreparedModel.fromJson(Map<String, dynamic> json) => _$FilesPreparedModelFromJson(json);
}

@freezed
abstract class FilesPreparedResponse with _$FilesPreparedResponse {
  const factory FilesPreparedResponse({required FilesPreparedModel data}) = _FilesPreparedResponse;
  factory FilesPreparedResponse.fromJson(Map<String, dynamic> json) => _$FilesPreparedResponseFromJson(json);
}

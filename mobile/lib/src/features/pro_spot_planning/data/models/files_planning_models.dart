import 'package:freezed_annotation/freezed_annotation.dart';

part 'files_planning_models.freezed.dart';
part 'files_planning_models.g.dart';

/// Planning des files (08/10/2026): one file as GET /internal/parkings/:id/files/planning lists it.
@freezed
abstract class FilesPlanningFileModel with _$FilesPlanningFileModel {
  const factory FilesPlanningFileModel({
    required String id,
    required String code,
    String? name,
    required int capacity,
    required bool active,

    /// The return day (YYYY-MM-DD) an empty file is kept for; null when free.
    String? plannedDay,

    /// The return day the file serves: its front car's local day, else [plannedDay].
    String? day,
    required int cars,
    required bool sound,

    /// The planned day was chosen by hand: the night preparation leaves it.
    @Default(false) bool keptByHand,
  }) = _FilesPlanningFileModel;

  factory FilesPlanningFileModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningFileModelFromJson(json);
}

/// One day of the window: the returns to come against the room of the files serving or kept for it.
@freezed
abstract class FilesPlanningDayModel with _$FilesPlanningDayModel {
  const factory FilesPlanningDayModel({
    required String date,
    required int returns,
    required int placed,
    required int toCome,
    required int onSite,
    @Default(<String>[]) List<String> filesServing,
    @Default(<String>[]) List<String> filesKept,
    required int room,
    required int missing,
  }) = _FilesPlanningDayModel;

  factory FilesPlanningDayModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningDayModelFromJson(json);
}

/// missing_room (date, count), over_capacity (date, count), unsound (fileCode, count).
@freezed
abstract class FilesPlanningAlertModel with _$FilesPlanningAlertModel {
  const factory FilesPlanningAlertModel({required String kind, String? date, int? count, String? fileCode}) = _FilesPlanningAlertModel;

  factory FilesPlanningAlertModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningAlertModelFromJson(json);
}

/// GET /internal/parkings/:id/files/planning
@freezed
abstract class FilesPlanningModel with _$FilesPlanningModel {
  const factory FilesPlanningModel({
    required String from,
    required int days,
    required String timezone,

    /// The parking's local day as the server reckons it (older API: absent, fall back to `from`).
    String? today,

    /// Sum of the capacities of the active files.
    @Default(0) int capacity,
    @Default(<FilesPlanningFileModel>[]) List<FilesPlanningFileModel> files,
    @Default(<FilesPlanningDayModel>[]) List<FilesPlanningDayModel> load,
    @Default(<FilesPlanningAlertModel>[]) List<FilesPlanningAlertModel> alerts,
  }) = _FilesPlanningModel;

  factory FilesPlanningModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningModelFromJson(json);
}

/// The file as PUT /internal/parkings/:id/files/:fileId/keep returns it (the ParkingFile row).
@freezed
abstract class KeptFileModel with _$KeptFileModel {
  const factory KeptFileModel({
    required String id,
    required String code,
    String? name,
    required int capacity,
    @Default(true) bool active,
    String? plannedDay,
    @Default(false) bool keptByHand,
  }) = _KeptFileModel;

  factory KeptFileModel.fromJson(Map<String, dynamic> json) => _$KeptFileModelFromJson(json);
}

/// `{ message, data }` of the keep route.
@freezed
abstract class KeptFileResponse with _$KeptFileResponse {
  const factory KeptFileResponse({required KeptFileModel data}) = _KeptFileResponse;

  factory KeptFileResponse.fromJson(Map<String, dynamic> json) => _$KeptFileResponseFromJson(json);
}

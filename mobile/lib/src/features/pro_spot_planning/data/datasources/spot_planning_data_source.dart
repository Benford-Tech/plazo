import '../client/spot_planning_client.dart';
import '../models/files_planning_models.dart';
import '../models/spot_planning_models.dart';

abstract class SpotPlanningDataSource {
  Future<SpotPlanningModel> get(String parkingId, String from, int days);
  Future<PreassignResultModel> preassign(String parkingId, String from, int days);
  Future<FilesPlanningModel> filesPlanning(String parkingId, String from, int days);

  /// `day` null frees the file.
  Future<KeptFileModel> keepFile(String parkingId, String fileId, String? day);
}

class SpotPlanningDataSourceImpl implements SpotPlanningDataSource {
  SpotPlanningDataSourceImpl(this._client);
  final SpotPlanningClient _client;

  @override
  Future<SpotPlanningModel> get(String parkingId, String from, int days) => _client.get(parkingId, from, days);

  @override
  Future<PreassignResultModel> preassign(String parkingId, String from, int days) async => (await _client.preassign(parkingId, from, days)).data;

  @override
  Future<FilesPlanningModel> filesPlanning(String parkingId, String from, int days) => _client.filesPlanning(parkingId, from, days);

  @override
  Future<KeptFileModel> keepFile(String parkingId, String fileId, String? day) async => (await _client.keepFile(parkingId, fileId, {'day': day})).data;
}

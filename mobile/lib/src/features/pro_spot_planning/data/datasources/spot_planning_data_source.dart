import '../client/spot_planning_client.dart';
import '../models/spot_planning_models.dart';

abstract class SpotPlanningDataSource {
  Future<SpotPlanningModel> get(String parkingId, String from, int days);
  Future<PreassignResultModel> preassign(String parkingId, String from, int days);
}

class SpotPlanningDataSourceImpl implements SpotPlanningDataSource {
  SpotPlanningDataSourceImpl(this._client);
  final SpotPlanningClient _client;

  @override
  Future<SpotPlanningModel> get(String parkingId, String from, int days) => _client.get(parkingId, from, days);

  @override
  Future<PreassignResultModel> preassign(String parkingId, String from, int days) async => (await _client.preassign(parkingId, from, days)).data;
}

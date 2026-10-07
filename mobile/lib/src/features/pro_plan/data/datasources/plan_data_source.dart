import '../client/plan_client.dart';
import '../models/plan_models.dart';

abstract class PlanDataSource {
  Future<ParkingSummaryModel> getParking();
  Future<ParkingPlanViewModel> getPlan(String parkingId);
  Future<ParkingPlanViewModel> saveOutline(String parkingId, List<List<double>> ring);
  Future<PlanEstimateModel> estimate(String parkingId);
  Future<ParkingPlanViewModel> generate(String parkingId, String layout);
  Future<List<GeocodeResultModel>> geocode(String query);
}

class PlanDataSourceImpl implements PlanDataSource {
  PlanDataSourceImpl(this.client);

  final PlanClient client;

  @override
  Future<ParkingSummaryModel> getParking() => client.getParking();

  @override
  Future<ParkingPlanViewModel> getPlan(String parkingId) => client.getPlan(parkingId);

  /// Only the outline is sent: the server excludes the IGN buildings it overlaps (B-A) and cuts
  /// the zones around them itself (T-A, `zonesAuto`); the pro space can refine both later.
  @override
  Future<ParkingPlanViewModel> saveOutline(String parkingId, List<List<double>> ring) async {
    final outline = {
      'type': 'Polygon',
      'coordinates': [ring],
    };
    final envelope = await client.updatePlan(parkingId, {
      'outline': outline,
      'settings': {'outlineSource': 'drawn', 'zonesAuto': true},
    });
    return envelope.data;
  }

  @override
  Future<PlanEstimateModel> estimate(String parkingId) => client.estimate(parkingId);

  @override
  Future<ParkingPlanViewModel> generate(String parkingId, String layout) async =>
      (await client.generate(parkingId, {'layout': layout, 'applyCapacity': true})).data;

  @override
  Future<List<GeocodeResultModel>> geocode(String query) async => (await client.geocode(query)).results;
}

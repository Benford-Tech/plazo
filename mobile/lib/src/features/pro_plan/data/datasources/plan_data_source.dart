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

  /// The drawn outline is also the single zone "Zone A" (the pro space can split it later).
  @override
  Future<ParkingPlanViewModel> saveOutline(String parkingId, List<List<double>> ring) async {
    final outline = {
      'type': 'Polygon',
      'coordinates': [ring],
    };
    final envelope = await client.updatePlan(parkingId, {
      'outline': outline,
      'zones': [
        {'id': 'main', 'name': 'Zone A', 'geometry': outline},
      ],
      'settings': {'outlineSource': 'drawn'},
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

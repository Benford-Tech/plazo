import '../client/planning_client.dart';
import '../models/planning_model.dart';
import '../models/staff_signal_model.dart';

abstract class PlanningDataSource {
  Future<PlanningModel> getPlanning();
  Future<LiveArrivalsModel> getLiveArrivals();
}

class PlanningDataSourceImpl implements PlanningDataSource {
  PlanningDataSourceImpl(this.client);

  final PlanningClient client;

  @override
  Future<PlanningModel> getPlanning() => client.getPlanning();

  @override
  Future<LiveArrivalsModel> getLiveArrivals() => client.getLiveArrivals();
}

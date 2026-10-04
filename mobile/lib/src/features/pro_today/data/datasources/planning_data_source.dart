import '../client/planning_client.dart';
import '../models/planning_model.dart';
import '../models/staff_signal_model.dart';

abstract class PlanningDataSource {
  Future<PlanningModel> getPlanning({String? date});
  Future<LiveArrivalsModel> getLiveArrivals();
}

class PlanningDataSourceImpl implements PlanningDataSource {
  PlanningDataSourceImpl(this.client);

  final PlanningClient client;

  @override
  Future<PlanningModel> getPlanning({String? date}) => client.getPlanning(date: date);

  @override
  Future<LiveArrivalsModel> getLiveArrivals() => client.getLiveArrivals();
}

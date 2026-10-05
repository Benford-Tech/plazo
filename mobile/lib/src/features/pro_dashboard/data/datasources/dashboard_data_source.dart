import '../client/dashboard_client.dart';
import '../models/dashboard_model.dart';

abstract class DashboardDataSource {
  Future<DashboardModel> getDashboard();
}

class DashboardDataSourceImpl implements DashboardDataSource {
  DashboardDataSourceImpl(this.client);

  final DashboardClient client;

  @override
  Future<DashboardModel> getDashboard() => client.getDashboard();
}

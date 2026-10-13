import '../client/revenue_client.dart';
import '../models/revenue_models.dart';

abstract class RevenueDataSource {
  Future<RevenueSummaryModel> summary();
  Future<RevenueReportModel> report({required String from, required String to, required String basis});
  Future<void> setPrice(String id, int priceCents);
}

class RevenueDataSourceImpl implements RevenueDataSource {
  RevenueDataSourceImpl(this._client);
  final RevenueClient _client;

  @override
  Future<RevenueSummaryModel> summary() => _client.summary();

  @override
  Future<RevenueReportModel> report({required String from, required String to, required String basis}) => _client.report(from, to, basis);

  @override
  Future<void> setPrice(String id, int priceCents) => _client.setPrice(id, {'priceCents': priceCents});
}

import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/revenue_data_source.dart';
import '../../data/models/revenue_models.dart';

abstract class RevenueRepository {
  Future<Either<Failure, RevenueSummaryModel>> summary();
  Future<Either<Failure, RevenueReportModel>> report({required String from, required String to, required String basis});
  Future<Either<Failure, void>> setPrice(String id, int priceCents);
}

class RevenueRepositoryImpl implements RevenueRepository {
  RevenueRepositoryImpl(this._dataSource);
  final RevenueDataSource _dataSource;

  @override
  Future<Either<Failure, RevenueSummaryModel>> summary() => _dataSource.summary().makeRequest();

  @override
  Future<Either<Failure, RevenueReportModel>> report({required String from, required String to, required String basis}) =>
      _dataSource.report(from: from, to: to, basis: basis).makeRequest();

  @override
  Future<Either<Failure, void>> setPrice(String id, int priceCents) => _dataSource.setPrice(id, priceCents).makeRequest();
}

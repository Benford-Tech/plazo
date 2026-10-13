import 'dart:async';

import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/revenue_data_source.dart';
import '../../data/models/revenue_models.dart';

abstract class RevenueRepository {
  /// Fires after each amount saved, so that the dashboard's card reads its figures again.
  Stream<void> get changes;
  Future<Either<Failure, RevenueSummaryModel>> summary();
  Future<Either<Failure, RevenueReportModel>> report({required String from, required String to, required String basis});
  Future<Either<Failure, void>> setPrice(String id, int priceCents);
}

class RevenueRepositoryImpl implements RevenueRepository {
  RevenueRepositoryImpl(this._dataSource);
  final RevenueDataSource _dataSource;
  final _changes = StreamController<void>.broadcast();

  @override
  Stream<void> get changes => _changes.stream;

  @override
  Future<Either<Failure, RevenueSummaryModel>> summary() => _dataSource.summary().makeRequest();

  @override
  Future<Either<Failure, RevenueReportModel>> report({required String from, required String to, required String basis}) =>
      _dataSource.report(from: from, to: to, basis: basis).makeRequest();

  @override
  Future<Either<Failure, void>> setPrice(String id, int priceCents) async {
    final result = await _dataSource.setPrice(id, priceCents).makeRequest();
    if (result.isRight) _changes.add(null);
    return result;
  }
}

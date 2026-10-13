import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/revenue_models.dart';
import '../repositories/revenue_repository.dart';

class GetRevenueSummaryUseCase with UseCase<RevenueSummaryModel, NoParams> {
  GetRevenueSummaryUseCase(this._repository);
  final RevenueRepository _repository;
  @override
  Future<Either<Failure, RevenueSummaryModel>> call(NoParams params) => _repository.summary();
}

class RevenueReportParams extends Equatable {
  const RevenueReportParams({required this.from, required this.to, this.basis = 'arrival'});
  final String from;
  final String to;
  final String basis;
  @override
  List<Object?> get props => [from, to, basis];
}

class GetRevenueReportUseCase with UseCase<RevenueReportModel, RevenueReportParams> {
  GetRevenueReportUseCase(this._repository);
  final RevenueRepository _repository;
  @override
  Future<Either<Failure, RevenueReportModel>> call(RevenueReportParams params) => _repository.report(from: params.from, to: params.to, basis: params.basis);
}

class SetReservationPriceParams extends Equatable {
  const SetReservationPriceParams({required this.id, required this.priceCents});
  final String id;
  final int priceCents;
  @override
  List<Object?> get props => [id, priceCents];
}

class SetReservationPriceUseCase with UseCase<void, SetReservationPriceParams> {
  SetReservationPriceUseCase(this._repository);
  final RevenueRepository _repository;
  @override
  Future<Either<Failure, void>> call(SetReservationPriceParams params) => _repository.setPrice(params.id, params.priceCents);
}

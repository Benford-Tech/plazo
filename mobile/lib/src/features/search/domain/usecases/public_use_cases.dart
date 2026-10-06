import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/public_models.dart';
import '../repositories/public_repository.dart';

/// Airports served by the platform (the picker appears when there is more than one).
class GetAirportsUseCase with UseCase<List<AirportModel>, NoParams> {
  GetAirportsUseCase(this._repository);
  final PublicRepository _repository;

  @override
  Future<Either<Failure, List<AirportModel>>> call(NoParams params) => _repository.airports();
}

class StayParams extends Equatable {
  const StayParams({required this.airport, this.parking, this.arrivalAt, this.returnAt});
  final String airport;
  final String? parking;
  final String? arrivalAt;
  final String? returnAt;
  @override
  List<Object?> get props => [airport, parking, arrivalAt, returnAt];
}

/// Parkings for a stay: availability and total price, computed by the API.
class SearchParkingsUseCase with UseCase<SearchResponseModel, StayParams> {
  SearchParkingsUseCase(this._repository);
  final PublicRepository _repository;

  @override
  Future<Either<Failure, SearchResponseModel>> call(StayParams params) =>
      _repository.search(airport: params.airport, arrivalAt: params.arrivalAt!, returnAt: params.returnAt!);
}

/// A parking's page, with its offer for the stay when dates are given.
class GetParkingUseCase with UseCase<ParkingResponseModel, StayParams> {
  GetParkingUseCase(this._repository);
  final PublicRepository _repository;

  @override
  Future<Either<Failure, ParkingResponseModel>> call(StayParams params) =>
      _repository.parking(airport: params.airport, slug: params.parking!, arrivalAt: params.arrivalAt, returnAt: params.returnAt);
}

/// The native payment sheet's settings (publishable key…).
class GetPaymentsConfigUseCase with UseCase<PaymentsConfigModel, NoParams> {
  GetPaymentsConfigUseCase(this._repository);
  final PublicRepository _repository;

  @override
  Future<Either<Failure, PaymentsConfigModel>> call(NoParams params) => _repository.paymentsConfig();
}

/// K-A (06/10/2026): the home map's live layer — the airport's parkings and its shuttles on the road.
class GetAirportLiveUseCase with UseCase<AirportLiveModel, String> {
  GetAirportLiveUseCase(this._repository);
  final PublicRepository _repository;

  @override
  Future<Either<Failure, AirportLiveModel>> call(String params) => _repository.live(params);
}

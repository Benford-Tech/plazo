import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../data/models/return_model.dart';
import '../repositories/return_repository.dart';

/// The return day of a booking (flight, meeting point, shuttle).
class GetReturnUseCase with UseCase<TravellerReturnModel, String> {
  GetReturnUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, TravellerReturnModel>> call(String reference) => _repository.getReturn(reference);
}

/// "J'ai atterri".
class DeclareLandedUseCase with UseCase<TravellerReturnModel, String> {
  DeclareLandedUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, TravellerReturnModel>> call(String reference) => _repository.landed(reference);
}

/// E (06/10/2026): "Mon vol a du retard", "Bagage perdu", or a word for the parking.
class ReturnNoticeParams extends Equatable {
  const ReturnNoticeParams({required this.reference, required this.kind, this.text});
  final String reference;
  final String kind;
  final String? text;
  @override
  List<Object?> get props => [reference, kind, text];
}

class SendReturnNoticeUseCase with UseCase<TravellerReturnModel, ReturnNoticeParams> {
  SendReturnNoticeUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, TravellerReturnModel>> call(ReturnNoticeParams params) =>
      _repository.notice(params.reference, kind: params.kind, text: params.text);
}

class WalkingRouteParams extends Equatable {
  const WalkingRouteParams({required this.reference, this.from});
  final String reference;
  final GeoPosition? from;
  @override
  List<Object?> get props => [reference, from];
}

/// The walking route to the meeting point (computed by the API).
class GetWalkingRouteUseCase with UseCase<WalkingRouteModel, WalkingRouteParams> {
  GetWalkingRouteUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, WalkingRouteModel>> call(WalkingRouteParams params) => _repository.route(params.reference, params.from);
}

/// The shuttle coming for the traveller (polled).
class GetShuttleStatusUseCase with UseCase<ShuttleStatusModel, String> {
  GetShuttleStatusUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, ShuttleStatusModel>> call(String reference) => _repository.shuttle(reference);
}

/// The parking's running shuttles during the stay ("Navette" block, S-A).
/// N-A: this phone receives "Votre navette est partie" / "est là" for the booking (asked once,
/// during the stay). Nothing happens on the web or without OneSignal.
class EnableShuttlePushesUseCase with UseCase<bool, String> {
  EnableShuttlePushesUseCase(this._repository);
  final ReturnRepository _repository;
  bool get supported => _repository.pushSupported;
  @override
  Future<Either<Failure, bool>> call(String reference) => _repository.enableShuttlePushes(reference);
}

class GetStayShuttlesUseCase with UseCase<StayShuttlesModel, String> {
  GetStayShuttlesUseCase(this._repository);
  final ReturnRepository _repository;
  @override
  Future<Either<Failure, StayShuttlesModel>> call(String reference) => _repository.stayShuttles(reference);
}

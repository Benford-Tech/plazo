import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../repositories/shuttle_repository.dart';

class GetPickupsUseCase with UseCase<PickupsModel, NoParams> {
  GetPickupsUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, PickupsModel>> call(NoParams params) => _repository.pickups();
}

class GetDeparturesUseCase with UseCase<DeparturesModel, NoParams> {
  GetDeparturesUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, DeparturesModel>> call(NoParams params) => _repository.departures();
}

class VehicleSheetParams extends Equatable {
  const VehicleSheetParams({this.id, required this.input});

  /// null: a new vehicle.
  final String? id;
  final VehicleSheetInput input;
  @override
  List<Object?> get props => [id, input.toJson()];
}

/// Adds (no id) or edits a vehicle's sheet (managers).
class SaveVehicleUseCase with UseCase<ShuttleVehicleModel, VehicleSheetParams> {
  SaveVehicleUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, ShuttleVehicleModel>> call(VehicleSheetParams params) =>
      params.id == null ? _repository.addVehicle(params.input) : _repository.updateVehicle(params.id!, params.input);
}

class RemoveVehicleUseCase with UseCase<void, String> {
  RemoveVehicleUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, void>> call(String id) => _repository.removeVehicle(id);
}

class GetVehiclesUseCase with UseCase<List<ShuttleVehicleModel>, NoParams> {
  GetVehiclesUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, List<ShuttleVehicleModel>>> call(NoParams params) => _repository.vehicles();
}

class GetCurrentTripUseCase with UseCase<StaffTripModel?, NoParams> {
  GetCurrentTripUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, StaffTripModel?>> call(NoParams params) => _repository.current();
}

/// The places the shuttle serves (D-A): the airport first (built in), then the parking's stops.
class GetStopsUseCase with UseCase<List<ShuttleStopModel>, NoParams> {
  GetStopsUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, List<ShuttleStopModel>>> call(NoParams params) => _repository.stops();
}

/// The operator's running shuttles for the team's live map (P-A).
class GetLiveShuttlesUseCase with UseCase<LiveShuttlesModel, NoParams> {
  GetLiveShuttlesUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, LiveShuttlesModel>> call(NoParams params) => _repository.live();
}

class StartTripParams extends Equatable {
  const StartTripParams({required this.reservationIds, required this.vehicle, this.direction = 'pickup', this.stopId});
  final List<String> reservationIds;
  final TripVehicleChoice vehicle;

  /// `pickup` (to the airport) or `dropoff` (to the terminal).
  final String direction;

  /// The stop served (D-A); null: the airport.
  final String? stopId;
  @override
  List<Object?> get props => [reservationIds, vehicle.vehicleId, vehicle.model, vehicle.colour, vehicle.plate, direction, stopId];
}

/// "Démarrer le trajet (N clients)".
class StartTripUseCase with UseCase<StaffTripModel, StartTripParams> {
  StartTripUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, StaffTripModel>> call(StartTripParams params) => _repository.start(params.reservationIds, params.vehicle, params.direction, params.stopId);
}

class TripPositionParams extends Equatable {
  const TripPositionParams({required this.tripId, required this.position});
  final String tripId;
  final GeoPosition position;
  @override
  List<Object?> get props => [tripId, position];
}

class SendTripPositionUseCase with UseCase<StaffTripModel, TripPositionParams> {
  SendTripPositionUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, StaffTripModel>> call(TripPositionParams params) => _repository.sendPosition(params.tripId, params.position);
}

/// "Clients récupérés · retour parking".
class EndTripUseCase with UseCase<StaffTripModel, String> {
  EndTripUseCase(this._repository);
  final ShuttleRepository _repository;
  @override
  Future<Either<Failure, StaffTripModel>> call(String tripId) => _repository.end(tripId);
}

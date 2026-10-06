import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/location_service.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';

abstract class ShuttleRepository {
  Future<Either<Failure, PickupsModel>> pickups();
  Future<Either<Failure, DeparturesModel>> departures();
  Future<Either<Failure, StayingModel>> staying();
  Future<Either<Failure, List<ShuttleVehicleModel>>> vehicles();
  Future<Either<Failure, ShuttleVehicleModel>> addVehicle(VehicleSheetInput input);
  Future<Either<Failure, ShuttleVehicleModel>> updateVehicle(String id, VehicleSheetInput input);
  Future<Either<Failure, void>> removeVehicle(String id);
  Future<Either<Failure, StaffTripModel?>> current();
  Future<Either<Failure, List<ShuttleStopModel>>> stops();
  Future<Either<Failure, LiveShuttlesModel>> live();
  Future<Either<Failure, ShuttleForecastModel>> forecast(String? date);
  Future<Either<Failure, StaffTripModel>> start(List<String> reservationIds, TripVehicleChoice vehicle, String direction, String? stopId);
  Future<Either<Failure, StaffTripModel>> sendPosition(String tripId, GeoPosition position);
  Future<Either<Failure, StaffTripModel>> end(String tripId);
}

class ShuttleRepositoryImpl implements ShuttleRepository {
  ShuttleRepositoryImpl(this._dataSource);

  final ShuttleDataSource _dataSource;

  @override
  Future<Either<Failure, PickupsModel>> pickups() => _dataSource.pickups().makeRequest();

  @override
  Future<Either<Failure, DeparturesModel>> departures() => _dataSource.departures().makeRequest();

  @override
  Future<Either<Failure, StayingModel>> staying() => _dataSource.staying().makeRequest();

  @override
  Future<Either<Failure, List<ShuttleVehicleModel>>> vehicles() => _dataSource.vehicles().makeRequest();

  @override
  Future<Either<Failure, ShuttleVehicleModel>> addVehicle(VehicleSheetInput input) => _dataSource.addVehicle(input).makeRequest();

  @override
  Future<Either<Failure, ShuttleVehicleModel>> updateVehicle(String id, VehicleSheetInput input) => _dataSource.updateVehicle(id, input).makeRequest();

  @override
  Future<Either<Failure, void>> removeVehicle(String id) => _dataSource.removeVehicle(id).makeRequest();

  @override
  Future<Either<Failure, StaffTripModel?>> current() => _dataSource.current().makeRequest();

  @override
  Future<Either<Failure, List<ShuttleStopModel>>> stops() => _dataSource.stops().makeRequest();

  @override
  Future<Either<Failure, LiveShuttlesModel>> live() => _dataSource.live().makeRequest();

  @override
  Future<Either<Failure, ShuttleForecastModel>> forecast(String? date) => _dataSource.forecast(date).makeRequest();

  @override
  Future<Either<Failure, StaffTripModel>> start(List<String> reservationIds, TripVehicleChoice vehicle, String direction, String? stopId) =>
      _dataSource.start(reservationIds, vehicle, direction, stopId).makeRequest();

  @override
  Future<Either<Failure, StaffTripModel>> sendPosition(String tripId, GeoPosition position) => _dataSource.sendPosition(tripId, position).makeRequest();

  @override
  Future<Either<Failure, StaffTripModel>> end(String tripId) => _dataSource.end(tripId).makeRequest();
}

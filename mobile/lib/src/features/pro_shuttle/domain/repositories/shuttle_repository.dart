import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/location_service.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';

abstract class ShuttleRepository {
  Future<Either<Failure, PickupsModel>> pickups();
  Future<Either<Failure, List<ShuttleVehicleModel>>> vehicles();
  Future<Either<Failure, StaffTripModel?>> current();
  Future<Either<Failure, StaffTripModel>> start(List<String> reservationIds, TripVehicleChoice vehicle);
  Future<Either<Failure, StaffTripModel>> sendPosition(String tripId, GeoPosition position);
  Future<Either<Failure, StaffTripModel>> end(String tripId);
}

class ShuttleRepositoryImpl implements ShuttleRepository {
  ShuttleRepositoryImpl(this._dataSource);

  final ShuttleDataSource _dataSource;

  @override
  Future<Either<Failure, PickupsModel>> pickups() => _dataSource.pickups().makeRequest();

  @override
  Future<Either<Failure, List<ShuttleVehicleModel>>> vehicles() => _dataSource.vehicles().makeRequest();

  @override
  Future<Either<Failure, StaffTripModel?>> current() => _dataSource.current().makeRequest();

  @override
  Future<Either<Failure, StaffTripModel>> start(List<String> reservationIds, TripVehicleChoice vehicle) =>
      _dataSource.start(reservationIds, vehicle).makeRequest();

  @override
  Future<Either<Failure, StaffTripModel>> sendPosition(String tripId, GeoPosition position) => _dataSource.sendPosition(tripId, position).makeRequest();

  @override
  Future<Either<Failure, StaffTripModel>> end(String tripId) => _dataSource.end(tripId).makeRequest();
}

import '../../../../services/location_service.dart';
import '../client/shuttle_client.dart';
import '../models/shuttle_models.dart';

/// The vehicle chosen when starting a trip: one on file (id), or typed by the driver.
class TripVehicleChoice {
  const TripVehicleChoice({this.vehicleId, this.model, this.colour, this.plate});
  final String? vehicleId;
  final String? model;
  final String? colour;
  final String? plate;

  Map<String, dynamic> toJson() => {
    if (vehicleId != null) 'vehicleId': vehicleId,
    if (vehicleId == null) 'vehicle': {'model': model, 'colour': colour, 'plate': plate},
  };
}

abstract class ShuttleDataSource {
  Future<PickupsModel> pickups();
  Future<List<ShuttleVehicleModel>> vehicles();
  Future<StaffTripModel?> current();
  Future<StaffTripModel> start(List<String> reservationIds, TripVehicleChoice vehicle);
  Future<StaffTripModel> sendPosition(String tripId, GeoPosition position);
  Future<StaffTripModel> end(String tripId);
}

class ShuttleDataSourceImpl implements ShuttleDataSource {
  ShuttleDataSourceImpl(this.client);

  final ShuttleClient client;

  @override
  Future<PickupsModel> pickups() => client.pickups();

  @override
  Future<List<ShuttleVehicleModel>> vehicles() async => (await client.vehicles()).data;

  @override
  Future<StaffTripModel?> current() async => (await client.current()).trip;

  @override
  Future<StaffTripModel> start(List<String> reservationIds, TripVehicleChoice vehicle) async =>
      (await client.start({'reservationIds': reservationIds, ...vehicle.toJson()})).trip!;

  @override
  Future<StaffTripModel> sendPosition(String tripId, GeoPosition position) async => (await client.position(tripId, {
    'lat': position.lat,
    'lng': position.lng,
    if (position.accuracy != null) 'accuracy': position.accuracy,
    'recordedAt': position.recordedAt.toUtc().toIso8601String(),
  })).trip!;

  @override
  Future<StaffTripModel> end(String tripId) async => (await client.end(tripId)).trip!;
}

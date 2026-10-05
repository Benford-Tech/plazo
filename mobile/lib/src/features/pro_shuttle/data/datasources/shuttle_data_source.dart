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

/// The vehicle sheet typed by a manager (null clears a field; a field left out keeps its value).
class VehicleSheetInput {
  const VehicleSheetInput({this.model, this.colour, this.plate, this.seats, this.inService, this.driverId, this.clearSeats = false, this.clearDriver = false});
  final String? model;
  final String? colour;
  final String? plate;
  final int? seats;
  final bool? inService;
  final String? driverId;
  final bool clearSeats;
  final bool clearDriver;

  Map<String, dynamic> toJson() => {
    if (model != null) 'model': model,
    if (colour != null) 'colour': colour!.trim().isEmpty ? null : colour!.trim(),
    if (plate != null) 'plate': plate!.trim().isEmpty ? null : plate!.trim(),
    if (seats != null || clearSeats) 'seats': seats,
    if (inService != null) 'inService': inService,
    if (driverId != null || clearDriver) 'driverId': driverId,
  };
}

abstract class ShuttleDataSource {
  Future<PickupsModel> pickups();
  Future<DeparturesModel> departures();
  Future<List<ShuttleVehicleModel>> vehicles();
  Future<ShuttleVehicleModel> addVehicle(VehicleSheetInput input);
  Future<ShuttleVehicleModel> updateVehicle(String id, VehicleSheetInput input);
  Future<void> removeVehicle(String id);
  Future<List<ShuttleStopModel>> stops();
  Future<LiveShuttlesModel> live();
  Future<StaffTripModel?> current();
  Future<StaffTripModel> start(List<String> reservationIds, TripVehicleChoice vehicle, String direction, String? stopId);
  Future<StaffTripModel> sendPosition(String tripId, GeoPosition position);
  Future<StaffTripModel> end(String tripId);
}

class ShuttleDataSourceImpl implements ShuttleDataSource {
  ShuttleDataSourceImpl(this.client);

  final ShuttleClient client;

  @override
  Future<PickupsModel> pickups() => client.pickups();

  @override
  Future<DeparturesModel> departures() => client.departures();

  @override
  Future<List<ShuttleVehicleModel>> vehicles() async => (await client.vehicles()).data;

  @override
  Future<ShuttleVehicleModel> addVehicle(VehicleSheetInput input) async => (await client.addVehicle(input.toJson())).data;

  @override
  Future<ShuttleVehicleModel> updateVehicle(String id, VehicleSheetInput input) async => (await client.updateVehicle(id, input.toJson())).data;

  @override
  Future<void> removeVehicle(String id) => client.removeVehicle(id);

  @override
  Future<List<ShuttleStopModel>> stops() async => (await client.stops()).data;

  @override
  Future<LiveShuttlesModel> live() => client.live();

  @override
  Future<StaffTripModel?> current() async => (await client.current()).trip;

  @override
  Future<StaffTripModel> start(List<String> reservationIds, TripVehicleChoice vehicle, String direction, String? stopId) async =>
      (await client.start({'reservationIds': reservationIds, 'direction': direction, 'stopId': ?stopId, ...vehicle.toJson()})).trip!;

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

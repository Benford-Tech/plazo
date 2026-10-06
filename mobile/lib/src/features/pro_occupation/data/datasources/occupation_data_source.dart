import '../client/occupation_client.dart';
import '../../../../services/location_service.dart';
import '../models/occupation_models.dart';

abstract class OccupationDataSource {
  Future<OccupationBoardModel> board(String parkingId);
  Future<List<OccupantModel>> search(String parkingId, String query);
  Future<OccupantModel> assign(String reservationId, {required String? spotId, String? keyHook, bool keysOnly = false, GeoPosition? car});
}

class OccupationDataSourceImpl implements OccupationDataSource {
  OccupationDataSourceImpl(this.client);

  final OccupationClient client;

  @override
  Future<OccupationBoardModel> board(String parkingId) => client.board(parkingId);

  @override
  Future<List<OccupantModel>> search(String parkingId, String query) async => (await client.search(parkingId, query)).results;

  @override
  Future<OccupantModel> assign(String reservationId, {required String? spotId, String? keyHook, bool keysOnly = false, GeoPosition? car}) async {
    final body = <String, dynamic>{'spotId': spotId};
    if (keysOnly || keyHook != null) body['keyHook'] = keyHook;
    // The valet's GPS fix where the car stands (06/10/2026).
    if (car != null) body['car'] = {'lat': car.lat, 'lng': car.lng, if (car.accuracy != null) 'accuracyM': car.accuracy!.round()};
    return (await client.assign(reservationId, body)).data;
  }
}

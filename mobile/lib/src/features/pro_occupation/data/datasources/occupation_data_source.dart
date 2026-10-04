import '../client/occupation_client.dart';
import '../models/occupation_models.dart';

abstract class OccupationDataSource {
  Future<OccupationBoardModel> board(String parkingId);
  Future<List<OccupantModel>> search(String parkingId, String query);
  Future<OccupantModel> assign(String reservationId, {required String? spotId, String? keyHook, bool keysOnly = false});
}

class OccupationDataSourceImpl implements OccupationDataSource {
  OccupationDataSourceImpl(this.client);

  final OccupationClient client;

  @override
  Future<OccupationBoardModel> board(String parkingId) => client.board(parkingId);

  @override
  Future<List<OccupantModel>> search(String parkingId, String query) async => (await client.search(parkingId, query)).results;

  @override
  Future<OccupantModel> assign(String reservationId, {required String? spotId, String? keyHook, bool keysOnly = false}) async {
    final body = <String, dynamic>{'spotId': spotId};
    if (keysOnly || keyHook != null) body['keyHook'] = keyHook;
    return (await client.assign(reservationId, body)).data;
  }
}

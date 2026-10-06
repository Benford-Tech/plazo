import '../client/reservations_client.dart';
import '../models/reservation_models.dart';

abstract class ReservationsDataSource {
  Future<ReservationPageModel> list({String? query, int page = 1, int limit = 20});
  Future<ReservationModel> get(String id);
  Future<ReservationModel> create(ReservationInput input);
  Future<ReservationModel> update(String id, ReservationInput input);
  Future<ReservationModel> changeStatus(String id, String status);
  Future<CapacityPreviewModel> capacity(String arrivalAt, String returnAt, {String? excludeId});
}

class ReservationsDataSourceImpl implements ReservationsDataSource {
  ReservationsDataSourceImpl(this._client);
  final ReservationsClient _client;

  @override
  Future<ReservationPageModel> list({String? query, int page = 1, int limit = 20}) => _client.list(query, page, limit);

  @override
  Future<ReservationModel> get(String id) => _client.get(id);

  @override
  Future<ReservationModel> create(ReservationInput input) async => (await _client.create(input.toBody())).data;

  @override
  Future<ReservationModel> update(String id, ReservationInput input) async => (await _client.update(id, input.toBody(patch: true))).data;

  @override
  Future<ReservationModel> changeStatus(String id, String status) async => (await _client.changeStatus(id, {'status': status})).data;

  @override

  @override
  Future<CapacityPreviewModel> capacity(String arrivalAt, String returnAt, {String? excludeId}) => _client.capacity(arrivalAt, returnAt, excludeId);
}

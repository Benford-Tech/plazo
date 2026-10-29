import '../../../../core/error/exceptions.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/extras_client.dart';
import '../models/extras_models.dart';

abstract class ExtrasDataSource {
  Future<TravellerExtrasModel> traveller(String reference);
  Future<ExtraOrderResponseModel> order(String reference, String kind);
  Future<TravellerExtrasModel> sync(String reference, String extraId);
  Future<TravellerExtrasModel> abandon(String reference, String extraId);
  Future<StaffExtrasModel> staff(String reservationId);
  Future<StaffExtrasModel> accept(String reservationId, String extraId);
  Future<StaffExtrasModel> done(String reservationId, String extraId);
  Future<StaffExtrasModel> refuse(String reservationId, String extraId, String? reason);
  Future<ExtraSettingsModel> settings(String parkingId);
  Future<ExtraSettingsModel> updateSettings(String parkingId, {int? leadHours, List<ExtraSettingModel>? offers});
}

class ExtrasDataSourceImpl implements ExtrasDataSource {
  ExtrasDataSourceImpl(this.client, this.storage);

  final ExtrasClient client;
  final SecureStorageService storage;

  Future<String> _token(String reference) async {
    final token = await storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return token;
  }

  @override
  Future<TravellerExtrasModel> traveller(String reference) async => client.traveller(reference, await _token(reference));

  @override
  Future<ExtraOrderResponseModel> order(String reference, String kind) async => client.order(reference, await _token(reference), {'kind': kind});

  @override
  Future<TravellerExtrasModel> sync(String reference, String extraId) async => client.sync(reference, await _token(reference), extraId);

  @override
  Future<TravellerExtrasModel> abandon(String reference, String extraId) async => client.abandon(reference, await _token(reference), extraId);

  @override
  Future<StaffExtrasModel> staff(String reservationId) => client.staff(reservationId);

  @override
  Future<StaffExtrasModel> accept(String reservationId, String extraId) => client.accept(reservationId, extraId);

  @override
  Future<StaffExtrasModel> done(String reservationId, String extraId) => client.done(reservationId, extraId);

  @override
  Future<StaffExtrasModel> refuse(String reservationId, String extraId, String? reason) =>
      client.refuse(reservationId, extraId, {if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim()});

  @override
  Future<ExtraSettingsModel> settings(String parkingId) => client.settings(parkingId);

  @override
  Future<ExtraSettingsModel> updateSettings(String parkingId, {int? leadHours, List<ExtraSettingModel>? offers}) => client.updateSettings(parkingId, {
    'leadHours': ?leadHours,
    if (offers != null)
      'offers': [
        for (final o in offers) {'kind': o.kind, 'enabled': o.enabled, 'priceCents': o.priceCents},
      ],
  });
}

import '../../../../core/error/exceptions.dart';
import '../../../../services/location_service.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/return_client.dart';
import '../models/return_model.dart';

abstract class ReturnDataSource {
  Future<TravellerReturnModel> getReturn(String reference);
  Future<TravellerReturnModel> landed(String reference);
  Future<StayShuttlesModel> stayShuttles(String reference);
  Future<WalkingRouteModel> route(String reference, GeoPosition? from);
  Future<ShuttleStatusModel> shuttle(String reference);
}

/// Reads the booking's manage token from the secure storage for every call.
class ReturnDataSourceImpl implements ReturnDataSource {
  ReturnDataSourceImpl(this.client, this.storage);

  final ReturnClient client;
  final SecureStorageService storage;

  Future<String> _token(String reference) async {
    final token = await storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return token;
  }

  @override
  Future<TravellerReturnModel> getReturn(String reference) async => client.getReturn(reference: reference, token: await _token(reference));

  @override
  Future<TravellerReturnModel> landed(String reference) async => client.landed(reference: reference, token: await _token(reference));

  @override
  Future<WalkingRouteModel> route(String reference, GeoPosition? from) async =>
      client.route(reference: reference, token: await _token(reference), lat: from?.lat, lng: from?.lng);

  @override
  Future<ShuttleStatusModel> shuttle(String reference) async => client.shuttle(reference: reference, token: await _token(reference));

  @override
  Future<StayShuttlesModel> stayShuttles(String reference) async => client.stayShuttles(reference: reference, token: await _token(reference));
}

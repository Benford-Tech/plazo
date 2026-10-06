import '../../../../core/error/exceptions.dart';
import '../../../../services/location_service.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/arrival_client.dart';
import '../models/arrival_model.dart';

abstract class ArrivalDataSource {
  Future<ArrivalModel> getArrival(String reference);
  Future<ArrivalModel> start(String reference, ArrivalKind kind, {String? note});
  Future<ArrivalModel> sendPosition(String reference, GeoPosition position);
  Future<ArrivalModel> announce(String reference, ArrivalKind kind, int minutes, {String? note});
  Future<ArrivalModel> atMeetingPoint(String reference, ArrivalKind kind, GeoPosition? position, {String? note});
  Future<ArrivalModel> stop(String reference, ArrivalKind? kind);
}

/// Reads the booking's manage token from the secure storage for every call: it never goes
/// through the blocs.
class ArrivalDataSourceImpl implements ArrivalDataSource {
  ArrivalDataSourceImpl(this.client, this.storage);

  final ArrivalClient client;
  final SecureStorageService storage;

  Future<String> _token(String reference) async {
    final token = await storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return token;
  }

  @override
  Future<ArrivalModel> getArrival(String reference) async => client.getArrival(reference: reference, token: await _token(reference));

  @override
  Future<ArrivalModel> start(String reference, ArrivalKind kind, {String? note}) async =>
      // The traveller tapped "Je suis en route — partager ma position" after reading what is shared.
      client.start(reference: reference, token: await _token(reference), body: {'kind': kind.apiValue, 'consent': true, ..._note(note)});

  @override
  Future<ArrivalModel> sendPosition(String reference, GeoPosition position) async => client.sendPosition(
    reference: reference,
    token: await _token(reference),
    body: {
      'lat': position.lat,
      'lng': position.lng,
      if (position.accuracy != null) 'accuracy': position.accuracy,
      'recordedAt': position.recordedAt.toUtc().toIso8601String(),
    },
  );

  @override
  Future<ArrivalModel> announce(String reference, ArrivalKind kind, int minutes, {String? note}) async =>
      client.announce(reference: reference, token: await _token(reference), body: {'kind': kind.apiValue, 'minutes': minutes, ..._note(note)});

  @override
  Future<ArrivalModel> atMeetingPoint(String reference, ArrivalKind kind, GeoPosition? position, {String? note}) async => client.atMeetingPoint(
    reference: reference,
    token: await _token(reference),
    body: {'kind': kind.apiValue, if (position != null) ...{'lat': position.lat, 'lng': position.lng}, ..._note(note)},
  );

  /// E (06/10/2026): the traveller's word, only when there is one.
  static Map<String, dynamic> _note(String? note) => note != null && note.trim().isNotEmpty ? {'note': note.trim()} : const {};

  @override
  Future<ArrivalModel> stop(String reference, ArrivalKind? kind) async =>
      client.stop(reference: reference, token: await _token(reference), body: {if (kind != null) 'kind': kind.apiValue});
}

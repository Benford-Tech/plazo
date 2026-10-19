import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/paperwork_client.dart';
import '../models/paperwork_models.dart';

/// Who is looking: the staff (a booking's id) or the traveller (a booking's reference and its stored token).
sealed class PaperworkOwner {
  const PaperworkOwner();
}

class StaffOwner extends PaperworkOwner {
  const StaffOwner(this.reservationId);
  final String reservationId;
}

class TravellerOwner extends PaperworkOwner {
  const TravellerOwner(this.reference);
  final String reference;
}

abstract class PaperworkDataSource {
  Future<PaperworkModel> load(PaperworkOwner owner);
  Future<CodeSentModel> sendCode(PaperworkOwner owner);

  /// With the SMS code, or (on the staff's phone) handwritten strokes.
  Future<PaperworkModel> sign(PaperworkOwner owner, {String? code, List<List<List<double>>>? strokes});
  Future<PaperworkModel> answer(PaperworkOwner owner, String kind, {required String decision, String? reserveText, List<List<List<double>>>? strokes});
  Future<Uint8List> photo(PaperworkOwner owner, String kind, String photoId);

  // Staff only.
  Future<PaperworkModel> start(String reservationId, String kind);
  Future<PaperworkModel> update(String reservationId, String kind, Map<String, dynamic> body);
  Future<AddedPhotoModel> addPhoto(String reservationId, String kind, String slot, Uint8List bytes);
  Future<PaperworkModel> removePhoto(String reservationId, String kind, String photoId);
  Future<PaperworkModel> complete(String reservationId, String kind);
}

class PaperworkDataSourceImpl implements PaperworkDataSource {
  PaperworkDataSourceImpl(this.client, this.dio, this.storage);

  final PaperworkClient client;
  final Dio dio;
  final SecureStorageService storage;

  Future<String> _token(String reference) async {
    final token = await storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return token;
  }

  @override
  Future<PaperworkModel> load(PaperworkOwner owner) async => switch (owner) {
    StaffOwner(:final reservationId) => client.staff(reservationId),
    TravellerOwner(:final reference) => client.traveller(reference, await _token(reference)),
  };

  @override
  Future<CodeSentModel> sendCode(PaperworkOwner owner) async => switch (owner) {
    StaffOwner(:final reservationId) => client.staffSendCode(reservationId),
    TravellerOwner(:final reference) => client.travellerSendCode(reference, await _token(reference)),
  };

  @override
  Future<PaperworkModel> sign(PaperworkOwner owner, {String? code, List<List<List<double>>>? strokes}) async => switch (owner) {
    StaffOwner(:final reservationId) => client.staffSign(reservationId, {'code': ?code, 'strokes': ?strokes}),
    TravellerOwner(:final reference) => client.travellerSign(reference, await _token(reference), {'code': code ?? ''}),
  };

  @override
  Future<PaperworkModel> answer(PaperworkOwner owner, String kind, {required String decision, String? reserveText, List<List<List<double>>>? strokes}) async {
    final body = {'decision': decision, 'reserveText': ?reserveText, 'strokes': ?strokes};
    return switch (owner) {
      StaffOwner(:final reservationId) => client.staffAnswer(reservationId, kind, body),
      TravellerOwner(:final reference) => client.travellerAnswer(reference, await _token(reference), kind, body),
    };
  }

  @override
  Future<Uint8List> photo(PaperworkOwner owner, String kind, String photoId) async {
    final (path, headers) = switch (owner) {
      StaffOwner(:final reservationId) => ('internal/reservations/$reservationId/inspections/$kind/photos/$photoId', <String, dynamic>{}),
      TravellerOwner(:final reference) => (
        'public/bookings/$reference/inspections/$kind/photos/$photoId',
        <String, dynamic>{'x-booking-token': await _token(reference)},
      ),
    };
    final res = await dio.get<List<int>>(
      path,
      options: Options(responseType: ResponseType.bytes, headers: headers),
    );
    return Uint8List.fromList(res.data ?? const []);
  }

  @override
  Future<PaperworkModel> start(String reservationId, String kind) => client.start(reservationId, kind);

  @override
  Future<PaperworkModel> update(String reservationId, String kind, Map<String, dynamic> body) => client.update(reservationId, kind, body);

  @override
  Future<AddedPhotoModel> addPhoto(String reservationId, String kind, String slot, Uint8List bytes) async {
    final res = await dio.post<Map<String, dynamic>>(
      'internal/reservations/$reservationId/inspections/$kind/photos',
      queryParameters: {'slot': slot},
      data: Stream.fromIterable([bytes]),
      options: Options(contentType: 'image/jpeg', headers: {Headers.contentLengthHeader: bytes.length}, sendTimeout: const Duration(seconds: 60)),
    );
    return AddedPhotoModel.fromJson(res.data!);
  }

  @override
  Future<PaperworkModel> removePhoto(String reservationId, String kind, String photoId) => client.removePhoto(reservationId, kind, photoId);

  @override
  Future<PaperworkModel> complete(String reservationId, String kind) => client.complete(reservationId, kind);
}

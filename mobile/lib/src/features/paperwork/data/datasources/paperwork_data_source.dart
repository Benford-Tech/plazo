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

  /// A contract PDF (26/10/2026): the parking's own contract (`template`), the PDF signed or the proof.
  Future<Uint8List> contractFile(PaperworkOwner owner, String kind);

  /// A report being taken: the staff's (Plazo Pro), or the traveller's own photos (Plazo, `…/mine`).
  Future<PaperworkModel> start(PaperworkOwner owner, String kind);
  Future<PaperworkModel> update(PaperworkOwner owner, String kind, Map<String, dynamic> body);
  Future<AddedPhotoModel> addPhoto(PaperworkOwner owner, String kind, String slot, Uint8List bytes);
  Future<PaperworkModel> removePhoto(PaperworkOwner owner, String kind, String photoId);
  Future<PaperworkModel> complete(PaperworkOwner owner, String kind);
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
  Future<Uint8List> contractFile(PaperworkOwner owner, String kind) async {
    final (path, headers) = switch (owner) {
      StaffOwner(:final reservationId) => ('internal/reservations/$reservationId/contract/file', <String, dynamic>{}),
      TravellerOwner(:final reference) => ('public/bookings/$reference/contract/file', <String, dynamic>{'x-booking-token': await _token(reference)}),
    };
    final res = await dio.get<List<int>>(
      path,
      queryParameters: {'kind': kind},
      options: Options(responseType: ResponseType.bytes, headers: headers),
    );
    return Uint8List.fromList(res.data ?? const []);
  }

  @override
  Future<PaperworkModel> start(PaperworkOwner owner, String kind) async => switch (owner) {
    StaffOwner(:final reservationId) => client.start(reservationId, kind),
    // The traveller's draft starts with their first photo or note: nothing to create yet.
    TravellerOwner() => load(owner),
  };

  @override
  Future<PaperworkModel> update(PaperworkOwner owner, String kind, Map<String, dynamic> body) async => switch (owner) {
    StaffOwner(:final reservationId) => client.update(reservationId, kind, body),
    TravellerOwner(:final reference) => client.travellerUpdate(reference, await _token(reference), kind, body),
  };

  @override
  Future<AddedPhotoModel> addPhoto(PaperworkOwner owner, String kind, String slot, Uint8List bytes) async {
    final (path, headers) = switch (owner) {
      StaffOwner(:final reservationId) => ('internal/reservations/$reservationId/inspections/$kind/photos', <String, dynamic>{}),
      TravellerOwner(:final reference) => (
        'public/bookings/$reference/inspections/$kind/mine/photos',
        <String, dynamic>{'x-booking-token': await _token(reference)},
      ),
    };
    final res = await dio.post<Map<String, dynamic>>(
      path,
      queryParameters: {'slot': slot},
      data: Stream.fromIterable([bytes]),
      options: Options(contentType: 'image/jpeg', headers: {...headers, Headers.contentLengthHeader: bytes.length}, sendTimeout: const Duration(seconds: 60)),
    );
    return AddedPhotoModel.fromJson(res.data!);
  }

  @override
  Future<PaperworkModel> removePhoto(PaperworkOwner owner, String kind, String photoId) async => switch (owner) {
    StaffOwner(:final reservationId) => client.removePhoto(reservationId, kind, photoId),
    TravellerOwner(:final reference) => client.travellerRemovePhoto(reference, await _token(reference), kind, photoId),
  };

  @override
  Future<PaperworkModel> complete(PaperworkOwner owner, String kind) async => switch (owner) {
    StaffOwner(:final reservationId) => client.complete(reservationId, kind),
    TravellerOwner(:final reference) => client.travellerComplete(reference, await _token(reference), kind),
  };
}

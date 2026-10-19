import 'dart:typed_data';

import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../../data/models/paperwork_models.dart';

abstract class PaperworkRepository {
  Future<Either<Failure, PaperworkModel>> load(PaperworkOwner owner);
  Future<Either<Failure, CodeSentModel>> sendCode(PaperworkOwner owner);
  Future<Either<Failure, PaperworkModel>> sign(PaperworkOwner owner, {String? code, List<List<List<double>>>? strokes});
  Future<Either<Failure, PaperworkModel>> answer(
    PaperworkOwner owner,
    String kind, {
    required String decision,
    String? reserveText,
    List<List<List<double>>>? strokes,
  });

  /// A photo's bytes, kept in memory for the session (a photo never changes: a new one gets a new id).
  Future<Either<Failure, Uint8List>> photo(PaperworkOwner owner, String kind, String photoId);
  Future<Either<Failure, PaperworkModel>> start(String reservationId, String kind);
  Future<Either<Failure, PaperworkModel>> update(String reservationId, String kind, Map<String, dynamic> body);
  Future<Either<Failure, AddedPhotoModel>> addPhoto(String reservationId, String kind, String slot, Uint8List bytes);
  Future<Either<Failure, PaperworkModel>> removePhoto(String reservationId, String kind, String photoId);
  Future<Either<Failure, PaperworkModel>> complete(String reservationId, String kind);
}

class PaperworkRepositoryImpl implements PaperworkRepository {
  PaperworkRepositoryImpl(this._dataSource);
  final PaperworkDataSource _dataSource;

  /// Photos by id (at most the last 60: a report holds 6 to 18).
  final _photos = <String, Uint8List>{};

  @override
  Future<Either<Failure, PaperworkModel>> load(PaperworkOwner owner) => _dataSource.load(owner).makeRequest();

  @override
  Future<Either<Failure, CodeSentModel>> sendCode(PaperworkOwner owner) => _dataSource.sendCode(owner).makeRequest();

  @override
  Future<Either<Failure, PaperworkModel>> sign(PaperworkOwner owner, {String? code, List<List<List<double>>>? strokes}) =>
      _dataSource.sign(owner, code: code, strokes: strokes).makeRequest();

  @override
  Future<Either<Failure, PaperworkModel>> answer(
    PaperworkOwner owner,
    String kind, {
    required String decision,
    String? reserveText,
    List<List<List<double>>>? strokes,
  }) => _dataSource.answer(owner, kind, decision: decision, reserveText: reserveText, strokes: strokes).makeRequest();

  @override
  Future<Either<Failure, Uint8List>> photo(PaperworkOwner owner, String kind, String photoId) async {
    final cached = _photos[photoId];
    if (cached != null) return Right(cached);
    final result = await _dataSource.photo(owner, kind, photoId).makeRequest();
    if (result case Right(:final value)) {
      if (_photos.length >= 60) _photos.remove(_photos.keys.first);
      _photos[photoId] = value;
    }
    return result;
  }

  @override
  Future<Either<Failure, PaperworkModel>> start(String reservationId, String kind) => _dataSource.start(reservationId, kind).makeRequest();

  @override
  Future<Either<Failure, PaperworkModel>> update(String reservationId, String kind, Map<String, dynamic> body) =>
      _dataSource.update(reservationId, kind, body).makeRequest();

  @override
  Future<Either<Failure, AddedPhotoModel>> addPhoto(String reservationId, String kind, String slot, Uint8List bytes) async {
    final result = await _dataSource.addPhoto(reservationId, kind, slot, bytes).makeRequest();
    // The bytes just sent are the photo: no need to download them again.
    if (result case Right(:final value)) _photos[value.photoId] = bytes;
    return result;
  }

  @override
  Future<Either<Failure, PaperworkModel>> removePhoto(String reservationId, String kind, String photoId) =>
      _dataSource.removePhoto(reservationId, kind, photoId).makeRequest();

  @override
  Future<Either<Failure, PaperworkModel>> complete(String reservationId, String kind) => _dataSource.complete(reservationId, kind).makeRequest();
}

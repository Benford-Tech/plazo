import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/reservations_data_source.dart';
import '../../data/models/reservation_models.dart';

abstract class ReservationsRepository {
  Future<Either<Failure, ReservationPageModel>> list({String? query, int page = 1});
  Future<Either<Failure, ReservationModel>> get(String id);
  Future<Either<Failure, ReservationModel>> create(ReservationInput input);
  Future<Either<Failure, ReservationModel>> update(String id, ReservationInput input, {bool names = true, bool price = false});
  Future<Either<Failure, ReservationModel>> changeStatus(String id, String status, {String? note});
  Future<Either<Failure, CapacityPreviewModel>> capacity(String arrivalAt, String returnAt, {String? excludeId});
}

class ReservationsRepositoryImpl implements ReservationsRepository {
  ReservationsRepositoryImpl(this._source);
  final ReservationsDataSource _source;

  @override
  Future<Either<Failure, ReservationPageModel>> list({String? query, int page = 1}) => _source.list(query: query, page: page).makeRequest();

  @override
  Future<Either<Failure, ReservationModel>> get(String id) => _source.get(id).makeRequest();

  @override
  Future<Either<Failure, ReservationModel>> create(ReservationInput input) => _source.create(input).makeRequest();

  @override
  Future<Either<Failure, ReservationModel>> update(String id, ReservationInput input, {bool names = true, bool price = false}) =>
      _source.update(id, input, names: names, price: price).makeRequest();

  @override
  Future<Either<Failure, ReservationModel>> changeStatus(String id, String status, {String? note}) => _source.changeStatus(id, status, note: note).makeRequest();

  @override

  @override
  Future<Either<Failure, CapacityPreviewModel>> capacity(String arrivalAt, String returnAt, {String? excludeId}) =>
      _source.capacity(arrivalAt, returnAt, excludeId: excludeId).makeRequest();
}

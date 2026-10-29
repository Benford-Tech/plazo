import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/extras_data_source.dart';
import '../../data/models/extras_models.dart';

abstract class ExtrasRepository {
  Future<Either<Failure, TravellerExtrasModel>> traveller(String reference);
  Future<Either<Failure, ExtraOrderResponseModel>> order(String reference, String kind);
  Future<Either<Failure, TravellerExtrasModel>> sync(String reference, String extraId);
  Future<Either<Failure, TravellerExtrasModel>> abandon(String reference, String extraId);
  Future<Either<Failure, StaffExtrasModel>> staff(String reservationId);
  Future<Either<Failure, StaffExtrasModel>> accept(String reservationId, String extraId);
  Future<Either<Failure, StaffExtrasModel>> done(String reservationId, String extraId);
  Future<Either<Failure, StaffExtrasModel>> refuse(String reservationId, String extraId, String? reason);
  Future<Either<Failure, ExtraSettingsModel>> settings(String parkingId);
  Future<Either<Failure, ExtraSettingsModel>> updateSettings(String parkingId, {int? leadHours, List<ExtraSettingModel>? offers});
}

class ExtrasRepositoryImpl implements ExtrasRepository {
  ExtrasRepositoryImpl(this._dataSource);
  final ExtrasDataSource _dataSource;

  @override
  Future<Either<Failure, TravellerExtrasModel>> traveller(String reference) => _dataSource.traveller(reference).makeRequest();

  @override
  Future<Either<Failure, ExtraOrderResponseModel>> order(String reference, String kind) => _dataSource.order(reference, kind).makeRequest();

  @override
  Future<Either<Failure, TravellerExtrasModel>> sync(String reference, String extraId) => _dataSource.sync(reference, extraId).makeRequest();

  @override
  Future<Either<Failure, TravellerExtrasModel>> abandon(String reference, String extraId) => _dataSource.abandon(reference, extraId).makeRequest();

  @override
  Future<Either<Failure, StaffExtrasModel>> staff(String reservationId) => _dataSource.staff(reservationId).makeRequest();

  @override
  Future<Either<Failure, StaffExtrasModel>> accept(String reservationId, String extraId) => _dataSource.accept(reservationId, extraId).makeRequest();

  @override
  Future<Either<Failure, StaffExtrasModel>> done(String reservationId, String extraId) => _dataSource.done(reservationId, extraId).makeRequest();

  @override
  Future<Either<Failure, StaffExtrasModel>> refuse(String reservationId, String extraId, String? reason) =>
      _dataSource.refuse(reservationId, extraId, reason).makeRequest();

  @override
  Future<Either<Failure, ExtraSettingsModel>> settings(String parkingId) => _dataSource.settings(parkingId).makeRequest();

  @override
  Future<Either<Failure, ExtraSettingsModel>> updateSettings(String parkingId, {int? leadHours, List<ExtraSettingModel>? offers}) =>
      _dataSource.updateSettings(parkingId, leadHours: leadHours, offers: offers).makeRequest();
}

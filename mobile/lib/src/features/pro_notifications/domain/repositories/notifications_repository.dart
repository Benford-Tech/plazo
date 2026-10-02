import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/notifications_data_source.dart';
import '../../data/models/notification_preferences_model.dart';

abstract class NotificationsRepository {
  bool get pushSupported;
  Future<Either<Failure, NotificationPreferencesModel>> getPreferences();
  Future<Either<Failure, NotificationPreferencesModel>> updatePreferences({bool? arrivals, bool? returns});
  Future<Either<Failure, String>> enablePush();
}

class NotificationsRepositoryImpl implements NotificationsRepository {
  NotificationsRepositoryImpl(this._dataSource);

  final NotificationsDataSource _dataSource;

  @override
  bool get pushSupported => _dataSource.pushSupported;

  @override
  Future<Either<Failure, NotificationPreferencesModel>> getPreferences() => _dataSource.getPreferences().makeRequest();

  @override
  Future<Either<Failure, NotificationPreferencesModel>> updatePreferences({bool? arrivals, bool? returns}) =>
      _dataSource.updatePreferences(arrivals: arrivals, returns: returns).makeRequest();

  @override
  Future<Either<Failure, String>> enablePush() => _dataSource.enablePush().makeRequest();
}

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/notification_preferences_model.dart';
import '../repositories/notifications_repository.dart';

class GetNotificationPreferencesUseCase with UseCase<NotificationPreferencesModel, NoParams> {
  GetNotificationPreferencesUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Either<Failure, NotificationPreferencesModel>> call(NoParams params) => _repository.getPreferences();
}

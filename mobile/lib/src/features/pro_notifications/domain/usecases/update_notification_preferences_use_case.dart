import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/notification_preferences_model.dart';
import '../repositories/notifications_repository.dart';

class PreferencesPatch extends Equatable {
  const PreferencesPatch({this.arrivals, this.returns});
  final bool? arrivals;
  final bool? returns;
  @override
  List<Object?> get props => [arrivals, returns];
}

class UpdateNotificationPreferencesUseCase with UseCase<NotificationPreferencesModel, PreferencesPatch> {
  UpdateNotificationPreferencesUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Either<Failure, NotificationPreferencesModel>> call(PreferencesPatch params) =>
      _repository.updatePreferences(arrivals: params.arrivals, returns: params.returns);
}

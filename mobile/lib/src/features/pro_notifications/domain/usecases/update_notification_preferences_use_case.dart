import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/notification_preferences_model.dart';
import '../repositories/notifications_repository.dart';

class PreferencesPatch extends Equatable {
  const PreferencesPatch({this.arrivals, this.returns, this.shuttles, this.platform, this.bookings});
  final bool? arrivals;
  final bool? returns;

  /// The shuttles' departures and returns (N-A).
  final bool? shuttles;

  /// The platform's messages (E-A).
  final bool? platform;

  /// New bookings from the site or an import (06/10/2026).
  final bool? bookings;
  @override
  List<Object?> get props => [arrivals, returns, shuttles, platform, bookings];
}

class UpdateNotificationPreferencesUseCase with UseCase<NotificationPreferencesModel, PreferencesPatch> {
  UpdateNotificationPreferencesUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Either<Failure, NotificationPreferencesModel>> call(PreferencesPatch params) =>
      _repository.updatePreferences(arrivals: params.arrivals, returns: params.returns, shuttles: params.shuttles, platform: params.platform, bookings: params.bookings);
}

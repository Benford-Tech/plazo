import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../repositories/notifications_repository.dart';

/// Asks the notification permission and registers this phone (OneSignal) for the staff's pushes.
class EnablePushUseCase with UseCase<String, NoParams> {
  EnablePushUseCase(this._repository);

  final NotificationsRepository _repository;

  bool get supported => _repository.pushSupported;

  @override
  Future<Either<Failure, String>> call(NoParams params) => _repository.enablePush();
}

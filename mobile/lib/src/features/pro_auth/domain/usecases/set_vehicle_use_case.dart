import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/staff_model.dart';
import '../repositories/auth_repository.dart';

/// "Mon véhicule aujourd'hui" (V-A, 05/10/2026): the shuttle taken for the day, stored on the
/// account; null hands it back.
class SetVehicleUseCase with UseCase<StaffModel, String?> {
  SetVehicleUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Either<Failure, StaffModel>> call(String? vehicleId) => _repository.setVehicle(vehicleId);
}

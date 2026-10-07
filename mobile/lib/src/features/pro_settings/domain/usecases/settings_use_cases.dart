import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/datasources/settings_data_source.dart';
import '../../data/models/settings_models.dart';
import '../repositories/settings_repository.dart';

class GetTeamUseCase with UseCase<List<TeamMemberModel>, NoParams> {
  GetTeamUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, List<TeamMemberModel>>> call(NoParams params) => _r.team();
}

class NewStaffParams extends Equatable {
  const NewStaffParams({required this.firstName, required this.lastName, required this.email, this.phone, required this.role, required this.password});
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String role;
  final String password;
  @override
  List<Object?> get props => [firstName, lastName, email, phone, role, password];
}

class CreateStaffUseCase with UseCase<TeamMemberModel, NewStaffParams> {
  CreateStaffUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, TeamMemberModel>> call(NewStaffParams p) =>
      _r.createStaff(firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone, role: p.role, password: p.password);
}

class UpdateStaffParams extends Equatable {
  const UpdateStaffParams({required this.id, this.role, this.isActive});
  final String id;
  final String? role;
  final bool? isActive;
  @override
  List<Object?> get props => [id, role, isActive];
}

class UpdateStaffUseCase with UseCase<TeamMemberModel, UpdateStaffParams> {
  UpdateStaffUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, TeamMemberModel>> call(UpdateStaffParams p) => _r.updateStaff(p.id, role: p.role, isActive: p.isActive);
}

class ResetPasswordParams extends Equatable {
  const ResetPasswordParams({required this.id, required this.password});
  final String id;
  final String password;
  @override
  List<Object?> get props => [id, password];
}

class ResetStaffPasswordUseCase with UseCase<void, ResetPasswordParams> {
  ResetStaffPasswordUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, void>> call(ResetPasswordParams p) => _r.resetPassword(p.id, p.password);
}

class ChangePasswordParams extends Equatable {
  const ChangePasswordParams({required this.currentPassword, required this.newPassword});
  final String currentPassword;
  final String newPassword;
  @override
  List<Object?> get props => [currentPassword, newPassword];
}

class ChangePasswordUseCase with UseCase<void, ChangePasswordParams> {
  ChangePasswordUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, void>> call(ChangePasswordParams p) => _r.changePassword(p.currentPassword, p.newPassword);
}

class GetParkingSettingsUseCase with UseCase<ParkingSettingsModel, NoParams> {
  GetParkingSettingsUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, ParkingSettingsModel>> call(NoParams params) => _r.parking();
}

class UpdateParkingParams extends Equatable {
  const UpdateParkingParams({required this.id, required this.input});
  final String id;
  final ParkingSettingsInput input;
  @override
  List<Object?> get props => [id, input.toBody()];
}

class UpdateParkingSettingsUseCase with UseCase<ParkingSettingsModel, UpdateParkingParams> {
  UpdateParkingSettingsUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, ParkingSettingsModel>> call(UpdateParkingParams p) => _r.updateParking(p.id, p.input);
}

class ShuttleTrackingParams extends Equatable {
  const ShuttleTrackingParams({required this.id, required this.tracking});
  final String id;

  /// "off", "team" or "everyone" (R-B, 07/10/2026).
  final String tracking;
  @override
  List<Object?> get props => [id, tracking];
}

class SetShuttleTrackingUseCase with UseCase<ParkingSettingsModel, ShuttleTrackingParams> {
  SetShuttleTrackingUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, ParkingSettingsModel>> call(ShuttleTrackingParams p) => _r.setShuttleTracking(p.id, p.tracking);
}

class GetSmsSettingsUseCase with UseCase<SmsSettingsModel, NoParams> {
  GetSmsSettingsUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, SmsSettingsModel>> call(NoParams params) => _r.smsSettings();
}

class GetSmsStatusUseCase with UseCase<SmsStatusModel, NoParams> {
  GetSmsStatusUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, SmsStatusModel>> call(NoParams params) => _r.smsStatus();
}

class SaveSmsSettingsUseCase with UseCase<SmsSettingsModel, SmsSettingsInput> {
  SaveSmsSettingsUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, SmsSettingsModel>> call(SmsSettingsInput p) => _r.saveSmsSettings(p);
}

class TestSmsUseCase with UseCase<SmsTestModel, String> {
  TestSmsUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, SmsTestModel>> call(String to) => _r.testSms(to);
}

class DisableSmsUseCase with UseCase<SmsSettingsModel, NoParams> {
  DisableSmsUseCase(this._r);
  final SettingsRepository _r;
  @override
  Future<Either<Failure, SmsSettingsModel>> call(NoParams params) => _r.disableSms();
}

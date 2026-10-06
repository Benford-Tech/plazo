import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/settings_data_source.dart';
import '../../data/models/settings_models.dart';

abstract class SettingsRepository {
  Future<Either<Failure, List<TeamMemberModel>>> team();
  Future<Either<Failure, TeamMemberModel>> createStaff({
    required String firstName,
    required String lastName,
    required String email,
    String? phone,
    required String role,
    required String password,
  });
  Future<Either<Failure, TeamMemberModel>> updateStaff(String id, {String? role, bool? isActive});
  Future<Either<Failure, void>> resetPassword(String id, String password);
  Future<Either<Failure, void>> changePassword(String currentPassword, String newPassword);
  Future<Either<Failure, ParkingSettingsModel>> parking();
  Future<Either<Failure, ParkingSettingsModel>> updateParking(String id, ParkingSettingsInput input);
  Future<Either<Failure, SmsSettingsModel>> smsSettings();
  Future<Either<Failure, SmsSettingsModel>> saveSmsSettings(SmsSettingsInput input);
  Future<Either<Failure, SmsTestModel>> testSms(String to);
  Future<Either<Failure, SmsSettingsModel>> disableSms();
  Future<Either<Failure, SmsStatusModel>> smsStatus();
}

class SettingsRepositoryImpl implements SettingsRepository {
  SettingsRepositoryImpl(this._source);
  final SettingsDataSource _source;

  @override
  Future<Either<Failure, List<TeamMemberModel>>> team() => _source.team().makeRequest();

  @override
  Future<Either<Failure, TeamMemberModel>> createStaff({
    required String firstName,
    required String lastName,
    required String email,
    String? phone,
    required String role,
    required String password,
  }) => _source.createStaff(firstName: firstName, lastName: lastName, email: email, phone: phone, role: role, password: password).makeRequest();

  @override
  Future<Either<Failure, TeamMemberModel>> updateStaff(String id, {String? role, bool? isActive}) =>
      _source.updateStaff(id, role: role, isActive: isActive).makeRequest();

  @override
  Future<Either<Failure, void>> resetPassword(String id, String password) => _source.resetPassword(id, password).makeRequest();

  @override
  Future<Either<Failure, void>> changePassword(String currentPassword, String newPassword) =>
      _source.changePassword(currentPassword, newPassword).makeRequest();

  @override
  Future<Either<Failure, ParkingSettingsModel>> parking() => _source.parking().makeRequest();

  @override
  Future<Either<Failure, ParkingSettingsModel>> updateParking(String id, ParkingSettingsInput input) => _source.updateParking(id, input).makeRequest();

  @override
  Future<Either<Failure, SmsSettingsModel>> smsSettings() => _source.smsSettings().makeRequest();

  @override
  Future<Either<Failure, SmsSettingsModel>> saveSmsSettings(SmsSettingsInput input) => _source.saveSmsSettings(input).makeRequest();

  @override
  Future<Either<Failure, SmsTestModel>> testSms(String to) => _source.testSms(to).makeRequest();

  @override
  Future<Either<Failure, SmsSettingsModel>> disableSms() => _source.disableSms().makeRequest();

  @override
  Future<Either<Failure, SmsStatusModel>> smsStatus() => _source.smsStatus().makeRequest();
}

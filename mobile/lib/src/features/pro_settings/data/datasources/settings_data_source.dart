import '../client/settings_client.dart';
import '../models/settings_models.dart';

/// The parking's settings as the form sends them (PATCH /internal/parkings/:id, every field).
class ParkingSettingsInput {
  const ParkingSettingsInput({
    required this.name,
    this.address,
    required this.totalCapacity,
    required this.safetyMarginPct,
    required this.shuttleTravelMinutes,
    this.terminalLeadMinutes = 120,
    this.landingDelayMinutes = 30,
  });
  final String name;
  final String? address;
  final int totalCapacity;
  final int safetyMarginPct;
  final int shuttleTravelMinutes;
  final int terminalLeadMinutes;
  final int landingDelayMinutes;

  Map<String, dynamic> toBody() => {
    'name': name,
    'address': (address ?? '').trim().isEmpty ? null : address!.trim(),
    'totalCapacity': totalCapacity,
    'safetyMarginPct': safetyMarginPct,
    'shuttleTravelMinutes': shuttleTravelMinutes,
    'terminalLeadMinutes': terminalLeadMinutes,
    'landingDelayMinutes': landingDelayMinutes,
  };
}

/// PUT /internal/sms/settings: the mode, and the gateway's credentials for mode "gateway".
class SmsSettingsInput {
  const SmsSettingsInput({required this.mode, this.login, this.password, this.senderPhone, this.baseUrl});
  final String mode;
  final String? login;
  final String? password;
  final String? senderPhone;
  final String? baseUrl;

  Map<String, dynamic> toBody() => {
    'mode': mode,
    if (mode == 'gateway') ...{
      'login': login,
      if ((password ?? '').isNotEmpty) 'password': password,
      'senderPhone': senderPhone,
      'baseUrl': (baseUrl ?? '').trim().isEmpty ? null : baseUrl!.trim(),
    },
  };
}

abstract class SettingsDataSource {
  Future<List<TeamMemberModel>> team();
  Future<TeamMemberModel> createStaff({required String firstName, required String lastName, required String email, String? phone, required String role, required String password});
  Future<TeamMemberModel> updateStaff(String id, {String? role, bool? isActive});
  Future<void> resetPassword(String id, String password);
  Future<void> changePassword(String currentPassword, String newPassword);
  Future<ParkingSettingsModel> parking();
  Future<ParkingSettingsModel> updateParking(String id, ParkingSettingsInput input);
  Future<ParkingSettingsModel> setShuttleTracking(String id, String tracking);
  Future<SmsSettingsModel> smsSettings();
  Future<SmsSettingsModel> saveSmsSettings(SmsSettingsInput input);
  Future<SmsTestModel> testSms(String to);
  Future<SmsSettingsModel> disableSms();
  Future<SmsStatusModel> smsStatus();
}

class SettingsDataSourceImpl implements SettingsDataSource {
  SettingsDataSourceImpl(this._client);
  final SettingsClient _client;

  @override
  Future<List<TeamMemberModel>> team() => _client.team();

  @override
  Future<TeamMemberModel> createStaff({required String firstName, required String lastName, required String email, String? phone, required String role, required String password}) async =>
      (await _client.createStaff({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        if ((phone ?? '').trim().isNotEmpty) 'phone': phone!.trim(),
        'role': role,
        'password': password,
      })).data;

  @override
  Future<TeamMemberModel> updateStaff(String id, {String? role, bool? isActive}) async =>
      (await _client.updateStaff(id, {'role': ?role, 'isActive': ?isActive})).data;

  @override
  Future<void> resetPassword(String id, String password) => _client.resetPassword(id, {'password': password});

  @override
  Future<void> changePassword(String currentPassword, String newPassword) =>
      _client.changePassword({'currentPassword': currentPassword, 'newPassword': newPassword});

  @override
  Future<ParkingSettingsModel> parking() => _client.parking();

  @override
  Future<ParkingSettingsModel> updateParking(String id, ParkingSettingsInput input) async => (await _client.updateParking(id, input.toBody())).data;

  @override
  Future<ParkingSettingsModel> setShuttleTracking(String id, String tracking) async => (await _client.setShuttleTracking(id, {'tracking': tracking})).data;

  @override
  Future<SmsSettingsModel> smsSettings() => _client.smsSettings();

  @override
  Future<SmsSettingsModel> saveSmsSettings(SmsSettingsInput input) => _client.saveSmsSettings(input.toBody());

  @override
  Future<SmsTestModel> testSms(String to) => _client.testSms({'to': to});

  @override
  Future<SmsSettingsModel> disableSms() => _client.disableSms();

  @override
  Future<SmsStatusModel> smsStatus() => _client.smsStatus();
}

import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../../../pro_reservations/data/client/reservations_client.dart';
import '../models/settings_models.dart';

part 'settings_client.g.dart';

@RestApi()
abstract class SettingsClient {
  factory SettingsClient(Dio dio, {String? baseUrl}) = _SettingsClient;

  @GET('internal/staff')
  Future<List<TeamMemberModel>> team();

  @POST('internal/staff')
  Future<DataEnvelope<TeamMemberModel>> createStaff(@Body() Map<String, dynamic> body);

  @PATCH('internal/staff/{id}')
  Future<DataEnvelope<TeamMemberModel>> updateStaff(@Path('id') String id, @Body() Map<String, dynamic> body);

  @POST('internal/staff/{id}/reset-password')
  Future<void> resetPassword(@Path('id') String id, @Body() Map<String, dynamic> body);

  @PATCH('internal/staff/me/password')
  Future<void> changePassword(@Body() Map<String, dynamic> body);

  /// « Code du jour » (13/10/2026, managers).
  @GET('internal/staff/join-code')
  Future<JoinCodeModel> joinCode();

  /// Requests to join the team, pending and not expired, oldest first.
  @GET('internal/staff/join-requests')
  Future<PendingJoinRequestsModel> joinRequests();

  /// « Accepter comme … »: { role } → 201 { staff } (the new member).
  @POST('internal/staff/join-requests/{id}/accept')
  Future<dynamic> acceptJoinRequest(@Path('id') String id, @Body() Map<String, dynamic> body);

  /// « Refuser » → { request }.
  @POST('internal/staff/join-requests/{id}/refuse')
  Future<void> refuseJoinRequest(@Path('id') String id);

  @GET('internal/parking')
  Future<ParkingSettingsModel> parking();

  @PATCH('internal/parkings/{id}')
  Future<DataEnvelope<ParkingSettingsModel>> updateParking(@Path('id') String id, @Body() Map<String, dynamic> body);

  @PUT('internal/parkings/{id}/shuttle-tracking')
  Future<DataEnvelope<ParkingSettingsModel>> setShuttleTracking(@Path('id') String id, @Body() Map<String, dynamic> body);

  @GET('internal/sms/settings')
  Future<SmsSettingsModel> smsSettings();

  @PUT('internal/sms/settings')
  Future<SmsSettingsModel> saveSmsSettings(@Body() Map<String, dynamic> body);

  @POST('internal/sms/test')
  Future<SmsTestModel> testSms(@Body() Map<String, dynamic> body);

  @POST('internal/sms/disable')
  Future<SmsSettingsModel> disableSms();

  @GET('internal/sms/status')
  Future<SmsStatusModel> smsStatus();
}

import '../../../../core/error/exceptions.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/auth_client.dart';
import '../models/staff_model.dart';

abstract class AuthDataSource {
  Future<StaffModel> login({required String email, required String password});
  Future<StaffModel?> restore();
  Future<void> logout();
  Future<StaffModel> setPost(String post);
  Future<StaffModel> setVehicle(String? vehicleId);
  Future<StaffModel> updateName({required String firstName, required String lastName});
}

class AuthDataSourceImpl implements AuthDataSource {
  AuthDataSourceImpl(this.client, this.storage);

  final AuthClient client;
  final SecureStorageService storage;

  @override
  Future<StaffModel> login({required String email, required String password}) async {
    final data = await client.login(body: {'email': email.trim(), 'password': password}) as Map<String, dynamic>;
    final tokenData = data['tokenData'] as Map<String, dynamic>?;
    final access = (tokenData?['access'] as Map?)?['token'] as String?;
    final refresh = (tokenData?['refresh'] as Map?)?['token'] as String?;
    if (access == null || refresh == null) throw const ServerException(code: 'generic');
    await storage.saveStaffTokens(StaffTokens(access: access, refresh: refresh));
    return StaffModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  /// The saved session, if it still works (the interceptor refreshes it when needed).
  @override
  Future<StaffModel?> restore() async {
    if (await storage.staffTokens() == null) return null;
    return client.me();
  }

  @override
  Future<StaffModel> setPost(String post) => client.setPost({'post': post});

  @override
  Future<StaffModel> setVehicle(String? vehicleId) => client.setVehicle({'vehicleId': vehicleId});

  @override
  Future<StaffModel> updateName({required String firstName, required String lastName}) =>
      client.updateMe({'firstName': firstName.trim(), 'lastName': lastName.trim()});

  @override
  Future<void> logout() async {
    try {
      await client.logout();
    } finally {
      await storage.clearStaffTokens();
    }
  }
}

import '../../../../core/error/exceptions.dart';
import '../../../../services/identity_sign_in_service.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/auth_client.dart';
import '../models/onboarding_models.dart';
import '../models/staff_model.dart';

/// Keeps the staff session of a login-shaped answer ({ tokenData, user }: password, Apple, Google, joined).
Future<StaffModel> storeStaffSession(SecureStorageService storage, Map<String, dynamic> data) async {
  final tokenData = data['tokenData'] as Map<String, dynamic>?;
  final access = (tokenData?['access'] as Map?)?['token'] as String?;
  final refresh = (tokenData?['refresh'] as Map?)?['token'] as String?;
  final user = data['user'];
  if (access == null || refresh == null || user is! Map<String, dynamic>) throw const ServerException(code: 'generic');
  await storage.saveStaffTokens(StaffTokens(access: access, refresh: refresh));
  return StaffModel.fromJson(user);
}

StaffModel _user(dynamic data) {
  final user = data is Map<String, dynamic> ? data['user'] : null;
  if (user is! Map<String, dynamic>) throw const ServerException(code: 'generic');
  return StaffModel.fromJson(user);
}

abstract class AuthDataSource {
  Future<StaffModel> login({required String email, required String password});
  Future<StaffModel?> restore();
  Future<void> logout();
  Future<StaffModel> setPost(String post);
  Future<StaffModel> setVehicle(String? vehicleId);
  Future<StaffModel> updateName({required String firstName, required String lastName});

  /// Mon compte › Connexion (13/10/2026): link or unlink Apple / Google.
  Future<StaffModel> linkApple(AppleCredential credential);
  Future<StaffModel> linkGoogle(String idToken);
  Future<StaffModel> unlinkIdentity(String provider);

  /// « Quitter ce parking »: the staff session ends; an onboarding one starts when an Apple / Google identity was linked.
  Future<OnboardingModel?> leave();

  /// « Supprimer mon compte », confirmed by the password, a fresh Apple code or a fresh Google token.
  Future<void> deleteAccount({String? password, String? appleAuthorizationCode, String? googleIdToken});
}

class AuthDataSourceImpl implements AuthDataSource {
  AuthDataSourceImpl(this.client, this.storage);

  final AuthClient client;
  final SecureStorageService storage;

  @override
  Future<StaffModel> login({required String email, required String password}) async {
    final data = await client.login(body: {'email': email.trim(), 'password': password}) as Map<String, dynamic>;
    final staff = await storeStaffSession(storage, data);
    // A password sign-in replaces a « Rejoindre un parking » left half-way on this phone.
    await storage.clearOnboardingToken();
    return staff;
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
  Future<StaffModel> linkApple(AppleCredential credential) async =>
      _user(await client.linkApple({'identityToken': credential.identityToken, 'rawNonce': credential.rawNonce}));

  @override
  Future<StaffModel> linkGoogle(String idToken) async => _user(await client.linkGoogle({'idToken': idToken}));

  @override
  Future<StaffModel> unlinkIdentity(String provider) async => _user(await client.unlinkIdentity(provider));

  @override
  Future<OnboardingModel?> leave() async {
    final data = await client.leave();
    // The server closed every session of the member.
    await storage.clearStaffTokens();
    final onboarding = data is Map<String, dynamic> ? data['onboarding'] : null;
    if (onboarding is! Map<String, dynamic>) return null;
    final token = onboarding['onboardingToken'] as String?;
    if (token == null) return null;
    await storage.saveOnboardingToken(token);
    return OnboardingModel.fromJson(onboarding);
  }

  @override
  Future<void> deleteAccount({String? password, String? appleAuthorizationCode, String? googleIdToken}) async {
    await client.deleteMe({'password': ?password, 'appleAuthorizationCode': ?appleAuthorizationCode, 'googleIdToken': ?googleIdToken});
    await storage.clearStaffTokens();
    await storage.clearOnboardingToken();
  }

  @override
  Future<void> logout() async {
    try {
      await client.logout();
    } finally {
      await storage.clearStaffTokens();
    }
  }
}

import 'package:equatable/equatable.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../services/identity_sign_in_service.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/onboarding_client.dart';
import '../models/onboarding_models.dart';
import '../models/staff_model.dart';
import 'auth_data_source.dart';

/// « Rejoindre un parking »: the code du jour, the person's names and the post they ask for (agent, driver, valet).
class JoinInput extends Equatable {
  const JoinInput({required this.code, required this.firstName, required this.lastName, required this.wishedRole});
  final String code;
  final String firstName;
  final String lastName;
  final String wishedRole;

  @override
  List<Object?> get props => [code, firstName, lastName, wishedRole];

  Map<String, dynamic> toBody() => {'code': code, 'firstName': firstName.trim(), 'lastName': lastName.trim(), 'wishedRole': wishedRole};
}

/// Plazo Pro sign-in with Apple or Google and the onboarding session (13/10/2026). The tokens go to the secure
/// storage here and never further: the models handed to the app hold none.
abstract class OnboardingDataSource {
  Future<ProvidersModel> providers();
  Future<IdentitySignInResult> signInWithApple(AppleCredential credential);
  Future<IdentitySignInResult> signInWithGoogle(String idToken);

  /// The saved onboarding session, if this phone has one (null: none).
  Future<OnboardingModel?> restore();
  Future<OnboardingModel> state();
  Future<JoinRequestModel> join(JoinInput input);

  /// The staff session, once a manager accepted the request; the onboarding one ends.
  Future<StaffModel> openSession();
  Future<JoinRequestModel> cancelRequest();
  Future<void> logout();
  Future<void> deleteIdentity({String? authorizationCode});
}

class OnboardingDataSourceImpl implements OnboardingDataSource {
  OnboardingDataSourceImpl(this.client, this.storage);

  final OnboardingClient client;
  final SecureStorageService storage;

  @override
  Future<ProvidersModel> providers() => client.providers();

  Future<IdentitySignInResult> _result(dynamic answer) async {
    if (answer is! Map<String, dynamic>) throw const ServerException(code: 'generic');
    if (answer['status'] == 'signed_in') {
      final staff = await storeStaffSession(storage, answer);
      await storage.clearOnboardingToken();
      return IdentitySignedIn(staff);
    }
    final token = answer['onboardingToken'] as String?;
    if (token == null || answer['identity'] is! Map) throw const ServerException(code: 'generic');
    await storage.saveOnboardingToken(token);
    return IdentityOnboarding(OnboardingModel.fromJson(answer));
  }

  @override
  Future<IdentitySignInResult> signInWithApple(AppleCredential credential) async {
    String? name(String? v) => (v ?? '').trim().isEmpty ? null : v!.trim();
    return _result(
      await client.apple({
        'identityToken': credential.identityToken,
        'rawNonce': credential.rawNonce,
        // Apple gives the name at the first authorisation only: sent once, kept by the server.
        'givenName': ?name(credential.givenName),
        'familyName': ?name(credential.familyName),
      }),
    );
  }

  @override
  Future<IdentitySignInResult> signInWithGoogle(String idToken) async => _result(await client.google({'idToken': idToken}));

  @override
  Future<OnboardingModel?> restore() async {
    if (await storage.onboardingToken() == null) return null;
    return client.state();
  }

  @override
  Future<OnboardingModel> state() => client.state();

  @override
  Future<JoinRequestModel> join(JoinInput input) async => (await client.join(input.toBody())).request;

  @override
  Future<StaffModel> openSession() async {
    final answer = await client.session();
    if (answer is! Map<String, dynamic>) throw const ServerException(code: 'generic');
    final staff = await storeStaffSession(storage, answer);
    await storage.clearOnboardingToken();
    return staff;
  }

  @override
  Future<JoinRequestModel> cancelRequest() async => (await client.cancelRequest()).request;

  @override
  Future<void> logout() async {
    try {
      await client.logout();
    } finally {
      await storage.clearOnboardingToken();
    }
  }

  @override
  Future<void> deleteIdentity({String? authorizationCode}) async {
    await client.deleteIdentity({'authorizationCode': ?authorizationCode});
    await storage.clearOnboardingToken();
  }
}

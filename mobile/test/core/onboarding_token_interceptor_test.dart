import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/networking/networking.dart';
import 'package:parking_app/src/features/pro_auth/data/client/auth_client.dart';
import 'package:parking_app/src/features/pro_auth/data/client/onboarding_client.dart';
import 'package:parking_app/src/features/pro_auth/data/datasources/auth_data_source.dart';
import 'package:parking_app/src/features/pro_auth/data/datasources/onboarding_data_source.dart';
import 'package:parking_app/src/features/pro_auth/data/models/onboarding_models.dart';
import 'package:parking_app/src/services/identity_sign_in_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

const _user = {'id': 'st9', 'name': 'Julie Martin', 'firstName': 'Julie', 'lastName': 'Martin', 'email': 'julie.m@icloud.com', 'role': 'driver'};
const _identity = {'provider': 'apple', 'email': 'julie.m@icloud.com', 'isPrivateEmail': false, 'firstName': 'Julie', 'lastName': 'Martin'};
const _request = {
  'id': 'jr1',
  'status': 'pending',
  'operatorName': 'Parkair Lyon',
  'firstName': 'Julie',
  'lastName': 'Martin',
  'wishedRole': 'driver',
  'role': null,
  'createdAt': '2026-10-13T07:38:00.000Z',
  'decidedAt': null,
  'expiresAt': '2026-10-20T07:38:00.000Z',
};

/// A fake API: answers by path, records the method, path and Authorization header of each call.
class FakeApi implements HttpClientAdapter {
  FakeApi(this.answers);
  final Map<String, (int, Object?)> answers;
  final calls = <String>[];
  final bodies = <String, Object?>{};

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    calls.add('${options.method} ${options.path} ${options.headers['Authorization']}');
    bodies['${options.method} ${options.path}'] = options.data;
    final (status, body) = answers['${options.method} ${options.path}'] ?? (404, {'message': 'not found', 'code': 'not_found'});
    return ResponseBody.fromString(
      body == null ? '' : jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  late InMemorySecureStorageService storage;
  late SessionEvents session;

  Dio client(FakeApi api) {
    final options = BaseOptions(baseUrl: 'http://api.test/api/', contentType: 'application/json');
    final refreshDio = Dio(options)..httpClientAdapter = api;
    return Dio(options)
      ..httpClientAdapter = api
      ..interceptors.addAll([
        StaffTokenInterceptor(storage: storage, refreshDio: refreshDio, session: session),
        OnboardingTokenInterceptor(storage: storage, session: session),
      ]);
  }

  setUp(() {
    storage = InMemorySecureStorageService();
    session = SessionEvents();
  });

  group('jeton d’inscription (Rejoindre un parking)', () {
    test('seules les routes /internal/auth/onboarding* le reçoivent ; jamais celui du personnel', () async {
      await storage.saveStaffTokens(const StaffTokens(access: 'staff', refresh: 'r'));
      await storage.saveOnboardingToken('onb');
      final api = FakeApi({
        'GET internal/auth/onboarding': (200, {'identity': _identity, 'request': _request}),
        'GET internal/auth/providers': (200, {'apple': true, 'google': false}),
        'GET internal/planning': (200, {'ok': true}),
      });
      final dio = client(api);
      await dio.get<dynamic>('internal/auth/onboarding');
      await dio.get<dynamic>('internal/auth/providers');
      await dio.get<dynamic>('internal/planning');
      expect(api.calls, ['GET internal/auth/onboarding Bearer onb', 'GET internal/auth/providers null', 'GET internal/planning Bearer staff']);
    });

    test('un 401 sur une route d’inscription efface ce jeton seulement, et le signale', () async {
      await storage.saveStaffTokens(const StaffTokens(access: 'staff', refresh: 'r'));
      await storage.saveOnboardingToken('onb');
      final expired = expectLater(session.onboardingExpired, emits(null));
      final api = FakeApi({
        'GET internal/auth/onboarding': (401, {'message': 'expired', 'code': 'unauthorized'}),
      });
      await expectLater(client(api).get<dynamic>('internal/auth/onboarding'), throwsA(isA<DioException>()));
      await expired;
      expect(await storage.onboardingToken(), isNull);
      expect(await storage.staffTokens(), isNotNull);
    });
  });

  group('connexion Apple / Google (source de données)', () {
    const apple = AppleCredential(identityToken: 'id.token', authorizationCode: 'code', rawNonce: 'raw', givenName: 'Julie', familyName: ' ');

    test('pas encore membre : jeton d’inscription gardé, jamais dans le modèle ; le nom donné par Apple part une fois', () async {
      final api = FakeApi({
        'POST internal/auth/apple': (
          200,
          {'status': 'onboarding', 'onboardingToken': 'onb', 'expiresAt': '2026-10-20T07:00:00.000Z', 'identity': _identity, 'request': null},
        ),
      });
      final source = OnboardingDataSourceImpl(OnboardingClient(client(api)), storage);
      final result = await source.signInWithApple(apple);
      expect(result, isA<IdentityOnboarding>());
      expect((result as IdentityOnboarding).onboarding.identity.email, 'julie.m@icloud.com');
      expect(await storage.onboardingToken(), 'onb');
      expect(await storage.staffTokens(), isNull);
      expect(api.bodies['POST internal/auth/apple'], {'identityToken': 'id.token', 'rawNonce': 'raw', 'givenName': 'Julie'});
    });

    test('déjà membre : session du personnel comme un mot de passe, l’inscription oubliée', () async {
      await storage.saveOnboardingToken('old');
      final api = FakeApi({
        'POST internal/auth/google': (
          200,
          {
            'status': 'signed_in',
            'tokenData': {
              'access': {'token': 'a1'},
              'refresh': {'token': 'r1'},
            },
            'user': _user,
          },
        ),
      });
      final source = OnboardingDataSourceImpl(OnboardingClient(client(api)), storage);
      final result = await source.signInWithGoogle('google.id');
      expect(result, isA<IdentitySignedIn>());
      expect((await storage.staffTokens())?.access, 'a1');
      expect(await storage.onboardingToken(), isNull);
    });

    test('demande acceptée : la session s’ouvre, le jeton d’inscription part', () async {
      await storage.saveOnboardingToken('onb');
      final api = FakeApi({
        'POST internal/auth/onboarding/session': (
          200,
          {
            'tokenData': {
              'access': {'token': 'a2'},
              'refresh': {'token': 'r2'},
            },
            'user': _user,
          },
        ),
        'POST internal/auth/onboarding/join': (201, {'request': _request}),
      });
      final source = OnboardingDataSourceImpl(OnboardingClient(client(api)), storage);
      final request = await source.join(const JoinInput(code: 'K7QM2XP9TD', firstName: ' Julie ', lastName: 'Martin', wishedRole: 'driver'));
      expect(request.isPending, isTrue);
      expect(api.bodies['POST internal/auth/onboarding/join'], {'code': 'K7QM2XP9TD', 'firstName': 'Julie', 'lastName': 'Martin', 'wishedRole': 'driver'});
      final staff = await source.openSession();
      expect(staff.role, 'driver');
      expect(api.calls.last, 'POST internal/auth/onboarding/session Bearer onb');
      expect((await storage.staffTokens())?.access, 'a2');
      expect(await storage.onboardingToken(), isNull);
    });

    test('« Quitter ce parking » : la session du personnel se ferme, celle d’inscription la suit', () async {
      await storage.saveStaffTokens(const StaffTokens(access: 'staff', refresh: 'r'));
      final api = FakeApi({
        'POST internal/staff/me/leave': (
          200,
          {
            'onboarding': {'onboardingToken': 'onb2', 'expiresAt': '2026-10-20T07:00:00.000Z', 'identity': _identity, 'request': null},
          },
        ),
        'DELETE internal/staff/me': (204, null),
      });
      final source = AuthDataSourceImpl(AuthClient(client(api)), storage);
      final onboarding = await source.leave();
      expect(onboarding?.identity.provider, 'apple');
      expect(await storage.staffTokens(), isNull);
      expect(await storage.onboardingToken(), 'onb2');
    });

    test('« Supprimer mon compte » : le mot de passe part, le téléphone oublie tout', () async {
      await storage.saveStaffTokens(const StaffTokens(access: 'staff', refresh: 'r'));
      final api = FakeApi({'DELETE internal/staff/me': (204, null)});
      final source = AuthDataSourceImpl(AuthClient(client(api)), storage);
      await source.deleteAccount(password: 'secret');
      expect(api.calls.single, 'DELETE internal/staff/me Bearer staff');
      expect(api.bodies['DELETE internal/staff/me'], {'password': 'secret'});
      expect(await storage.staffTokens(), isNull);
    });
  });
}

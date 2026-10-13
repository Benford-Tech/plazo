import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../core/constants/app_constants.dart';

/// What Apple gives the app at a sign-in: the identity token for the API, the one-time authorization code (used
/// to revoke Apple's access when an account is deleted), the raw nonce whose SHA-256 is in the token, and the name
/// (only at the first authorisation of the app).
class AppleCredential {
  const AppleCredential({required this.identityToken, required this.authorizationCode, required this.rawNonce, this.givenName, this.familyName});

  final String identityToken;
  final String authorizationCode;
  final String rawNonce;
  final String? givenName;
  final String? familyName;
}

/// The person closed Apple's or Google's sheet: nothing to report.
class IdentitySignInCancelled implements Exception {
  const IdentitySignInCancelled();
}

/// Apple or Google could not give a credential (no network, misconfigured build…). Never carries a token.
class IdentitySignInFailed implements Exception {
  const IdentitySignInFailed(this.reason);
  final String reason;

  @override
  String toString() => 'IdentitySignInFailed($reason)';
}

/// Plazo Pro sign-in (13/10/2026): Apple on iPhone, Google on Android, never on the web (the store screenshots drive
/// the email form). Each one only when the build carries its setting (APPLE_SIGN_IN, GOOGLE_SERVER_CLIENT_ID).
abstract class IdentitySignInService {
  bool get appleSupported;
  bool get googleSupported;

  /// Apple's sheet; throws [IdentitySignInCancelled] or [IdentitySignInFailed].
  Future<AppleCredential> apple();

  /// Google's account picker, then its ID token; throws [IdentitySignInCancelled] or [IdentitySignInFailed].
  Future<String> googleIdToken();

  /// Forgets the Google account chosen on this phone (« Utiliser un autre compte », logout). Never fails.
  Future<void> signOut();
}

/// A random nonce: Apple puts its SHA-256 in the identity token, the API checks it against the raw value.
String newRawNonce([Random? random]) {
  final rng = random ?? Random.secure();
  return base64UrlEncode(List<int>.generate(32, (_) => rng.nextInt(256))).replaceAll('=', '');
}

String sha256Hex(String input) => sha256.convert(utf8.encode(input)).toString();

class NativeIdentitySignInService implements IdentitySignInService {
  NativeIdentitySignInService({this._appleEnabled = AppConstants.appleSignIn, this._googleServerClientId = AppConstants.googleServerClientId, this._platform});

  final bool _appleEnabled;
  final String _googleServerClientId;
  final TargetPlatform? _platform;
  Future<void>? _googleReady;

  TargetPlatform get _target => _platform ?? defaultTargetPlatform;

  @override
  bool get appleSupported => !kIsWeb && _appleEnabled && _target == TargetPlatform.iOS;

  @override
  bool get googleSupported => !kIsWeb && _googleServerClientId.isNotEmpty && _target == TargetPlatform.android;

  @override
  Future<AppleCredential> apple() async {
    if (!appleSupported) throw const IdentitySignInFailed('apple_unsupported');
    final rawNonce = newRawNonce();
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: const [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
        nonce: sha256Hex(rawNonce),
      );
      final token = credential.identityToken;
      if (token == null || token.isEmpty) throw const IdentitySignInFailed('apple_no_token');
      return AppleCredential(
        identityToken: token,
        authorizationCode: credential.authorizationCode,
        rawNonce: rawNonce,
        givenName: credential.givenName,
        familyName: credential.familyName,
      );
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) throw const IdentitySignInCancelled();
      throw IdentitySignInFailed('apple_${e.code.name}');
    } on SignInWithAppleException {
      throw const IdentitySignInFailed('apple_error');
    }
  }

  Future<void> _google() => _googleReady ??= GoogleSignIn.instance.initialize(serverClientId: _googleServerClientId);

  @override
  Future<String> googleIdToken() async {
    if (!googleSupported) throw const IdentitySignInFailed('google_unsupported');
    try {
      await _google();
      final account = await GoogleSignIn.instance.authenticate();
      final token = account.authentication.idToken;
      if (token == null || token.isEmpty) throw const IdentitySignInFailed('google_no_token');
      return token;
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled || e.code == GoogleSignInExceptionCode.interrupted) throw const IdentitySignInCancelled();
      throw IdentitySignInFailed('google_${e.code.name}');
    }
  }

  @override
  Future<void> signOut() async {
    if (!googleSupported) return;
    try {
      await _google();
      await GoogleSignIn.instance.signOut();
    } catch (_) {
      // Nothing to forget, or Google unavailable: the next sign-in shows the picker anyway.
    }
  }
}

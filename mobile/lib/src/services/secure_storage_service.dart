import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The staff's tokens (access + refresh), as returned by /internal/auth/login and /refresh.
class StaffTokens {
  const StaffTokens({required this.access, required this.refresh});

  final String access;
  final String refresh;

  Map<String, dynamic> toJson() => {'access': access, 'refresh': refresh};

  factory StaffTokens.fromJson(Map<String, dynamic> json) => StaffTokens(access: json['access'] as String, refresh: json['refresh'] as String);
}

/// Secrets kept in the phone's keychain / keystore: the manage token of each booking opened in the
/// app (no traveller account), and the staff's session. Never in plain preferences, never logged.
abstract class SecureStorageService {
  Future<void> saveBookingToken(String reference, String token);
  Future<String?> bookingToken(String reference);
  Future<List<String>> bookingReferences();
  Future<void> forgetBooking(String reference);

  Future<void> saveStaffTokens(StaffTokens tokens);
  Future<StaffTokens?> staffTokens();
  Future<void> clearStaffTokens();
}

class SecureStorageServiceImpl implements SecureStorageService {
  SecureStorageServiceImpl([FlutterSecureStorage? storage]) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _bookingsKey = 'bookings';
  static const _staffKey = 'staff_tokens';
  static String _bookingKey(String reference) => 'booking_token_${reference.toUpperCase()}';

  @override
  Future<void> saveBookingToken(String reference, String token) async {
    final ref = reference.toUpperCase();
    await _storage.write(key: _bookingKey(ref), value: token);
    final refs = await bookingReferences();
    await _storage.write(key: _bookingsKey, value: jsonEncode([ref, ...refs.where((r) => r != ref)]));
  }

  @override
  Future<String?> bookingToken(String reference) => _storage.read(key: _bookingKey(reference));

  @override
  Future<List<String>> bookingReferences() async {
    final raw = await _storage.read(key: _bookingsKey);
    if (raw == null) return [];
    try {
      return (jsonDecode(raw) as List).cast<String>();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<void> forgetBooking(String reference) async {
    final ref = reference.toUpperCase();
    await _storage.delete(key: _bookingKey(ref));
    final refs = await bookingReferences();
    await _storage.write(key: _bookingsKey, value: jsonEncode(refs.where((r) => r != ref).toList()));
  }

  @override
  Future<void> saveStaffTokens(StaffTokens tokens) => _storage.write(key: _staffKey, value: jsonEncode(tokens.toJson()));

  @override
  Future<StaffTokens?> staffTokens() async {
    final raw = await _storage.read(key: _staffKey);
    if (raw == null) return null;
    try {
      return StaffTokens.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> clearStaffTokens() => _storage.delete(key: _staffKey);
}

/// In memory (tests, and a fallback where the keychain is unavailable).
class InMemorySecureStorageService implements SecureStorageService {
  final Map<String, String> _bookings = {};
  StaffTokens? _staff;

  @override
  Future<void> saveBookingToken(String reference, String token) async => _bookings[reference.toUpperCase()] = token;
  @override
  Future<String?> bookingToken(String reference) async => _bookings[reference.toUpperCase()];
  @override
  Future<List<String>> bookingReferences() async => _bookings.keys.toList().reversed.toList();
  @override
  Future<void> forgetBooking(String reference) async => _bookings.remove(reference.toUpperCase());
  @override
  Future<void> saveStaffTokens(StaffTokens tokens) async => _staff = tokens;
  @override
  Future<StaffTokens?> staffTokens() async => _staff;
  @override
  Future<void> clearStaffTokens() async => _staff = null;
}

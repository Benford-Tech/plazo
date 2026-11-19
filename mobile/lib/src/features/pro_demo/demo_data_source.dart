import 'package:dio/dio.dart';

import '../../services/secure_storage_service.dart';
import '../pro_auth/data/datasources/auth_data_source.dart';
import '../pro_auth/data/models/staff_model.dart';

/// The demo's four roles, as the server names them (`DEMO_ROLES` of backend/src/domain/prospect-demo.ts).
const demoRoles = ['manager', 'agent', 'driver', 'valet'];

/// A prospect's own demo link (GET /public/demo/links/:token): `valid`, `expired` or `unknown`, and the prospect's
/// parking for the greeting.
class DemoLinkState {
  const DemoLinkState({required this.status, this.companyName});

  final String status;
  final String? companyName;

  bool get valid => status == 'valid';

  factory DemoLinkState.fromJson(Map<String, dynamic> json) =>
      DemoLinkState(status: json['status'] as String? ?? 'unknown', companyName: json['companyName'] as String?);
}

abstract class DemoDataSource {
  Future<DemoLinkState> link(String token);

  /// POST /internal/auth/demo { role, token? } → a session like a sign-in's, kept as the staff's session.
  Future<StaffModel> enter(String role, {String? token});
}

/// 19/11/2026 (« pouvoir lancer l'app mobile Plazo Pro en mode démo avec le lien », choix « Lien + bouton »): the
/// prospects' demo of the web pro space (/pro/demo), in Plazo Pro. Dio without freezed.
class DemoDataSourceImpl implements DemoDataSource {
  DemoDataSourceImpl(this._dio, this._storage);

  final Dio _dio;
  final SecureStorageService _storage;

  @override
  Future<DemoLinkState> link(String token) async {
    final res = await _dio.get<Map<String, dynamic>>('public/demo/links/${Uri.encodeComponent(token)}');
    return DemoLinkState.fromJson(res.data ?? const <String, dynamic>{});
  }

  @override
  Future<StaffModel> enter(String role, {String? token}) async {
    final res = await _dio.post<Map<String, dynamic>>('internal/auth/demo', data: {'role': role, 'token': ?token});
    final staff = await storeStaffSession(_storage, res.data ?? const <String, dynamic>{});
    // The demo replaces a « Rejoindre un parking » left half-way on this phone, as a sign-in does.
    await _storage.clearOnboardingToken();
    return staff;
  }
}

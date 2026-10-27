import 'dart:io' show Platform;

import 'package:dio/dio.dart';

/// « Lien court Plazo » (direction B, 27/10/2026): the booking behind https://www.plazo.fr/a/<REF>-<code>.
class AppLinkTarget {
  const AppLinkTarget({
    required this.reference,
    required this.manageToken,
    required this.firstName,
    required this.parkingTitle,
    required this.arrivalAt,
    required this.returnAt,
    this.match,
  });

  final String reference;
  final String manageToken;
  final String firstName;
  final String parkingTitle;

  /// Local time of the parking, "YYYY-MM-DDTHH:mm".
  final String arrivalAt;
  final String returnAt;

  /// At the first launch: "code" (the store passed the code) or "device" (the phone was recognised: to confirm).
  final String? match;

  factory AppLinkTarget.fromJson(Map<String, dynamic> json) => AppLinkTarget(
    reference: json['reference'] as String,
    manageToken: json['manageToken'] as String,
    firstName: json['firstName'] as String? ?? '',
    parkingTitle: (json['parking'] as Map<String, dynamic>?)?['title'] as String? ?? '',
    arrivalAt: json['arrivalAt'] as String? ?? '',
    returnAt: json['returnAt'] as String? ?? '',
    match: json['match'] as String?,
  );
}

/// The platform the API expects ("ios" or "android").
String appLinkPlatform() => Platform.isIOS ? 'ios' : 'android';

abstract class AppLinkDataSource {
  /// GET /public/app-link/:code — throws on an unknown, forged or expired code.
  Future<AppLinkTarget> resolve(String code);

  /// POST /public/app-link/resume — the booking this phone was waiting for (consumed), or null.
  Future<AppLinkTarget?> resume({String? code});
}

class AppLinkDataSourceImpl implements AppLinkDataSource {
  AppLinkDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<AppLinkTarget> resolve(String code) async {
    final res = await _dio.get<Map<String, dynamic>>('public/app-link/${Uri.encodeComponent(code)}');
    return AppLinkTarget.fromJson(res.data ?? const {});
  }

  @override
  Future<AppLinkTarget?> resume({String? code}) async {
    final res = await _dio.post<Map<String, dynamic>>(
      'public/app-link/resume',
      data: {'platform': appLinkPlatform(), if (code != null && code.isNotEmpty) 'code': code},
    );
    final data = res.data ?? const {};
    if (data['found'] != true) return null;
    return AppLinkTarget.fromJson(data);
  }
}

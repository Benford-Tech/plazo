import 'package:dio/dio.dart';

/// A supplement applied on a booking (12/11/2026, « fais B dans Plazo Pro aussi »): its name and amount frozen, who
/// added it and when (the parking's local time, « 2026-11-12T22:04 »).
class AppliedSurcharge {
  const AppliedSurcharge({required this.id, required this.label, required this.amountCents, required this.at, this.by});
  final String id;
  final String label;
  final int amountCents;
  final String at;
  final String? by;

  factory AppliedSurcharge.fromJson(Map<String, dynamic> j) => AppliedSurcharge(
    id: j['id'] as String,
    label: j['label'] as String? ?? '',
    amountCents: (j['amountCents'] as num?)?.toInt() ?? 0,
    at: j['at'] as String? ?? '',
    by: j['by'] as String?,
  );
}

/// A supplement the parking offers, added in one touch.
class SurchargeOption {
  const SurchargeOption({required this.key, required this.label, required this.amountCents});
  final String key;
  final String label;
  final int amountCents;

  factory SurchargeOption.fromJson(Map<String, dynamic> j) =>
      SurchargeOption(key: j['key'] as String, label: j['label'] as String? ?? '', amountCents: (j['amountCents'] as num?)?.toInt() ?? 0);
}

/// The late arrival Plazo spots at the drop-off: the team applies it or says no.
class LateSuggestion {
  const LateSuggestion({required this.lateMinutes, required this.amountCents, required this.scheduledAt, required this.arrivedAt});
  final int lateMinutes;
  final int amountCents;
  final String scheduledAt;
  final String arrivedAt;

  factory LateSuggestion.fromJson(Map<String, dynamic> j) => LateSuggestion(
    lateMinutes: (j['lateMinutes'] as num?)?.toInt() ?? 0,
    amountCents: (j['amountCents'] as num?)?.toInt() ?? 0,
    scheduledAt: j['scheduledAt'] as String? ?? '',
    arrivedAt: j['arrivedAt'] as String? ?? '',
  );
}

class BookingSurcharges {
  const BookingSurcharges({this.surcharges = const [], this.options = const [], this.suggestion, this.totalCents = 0, this.canEdit = false});
  final List<AppliedSurcharge> surcharges;
  final List<SurchargeOption> options;
  final LateSuggestion? suggestion;
  final int totalCents;
  final bool canEdit;

  /// Nothing to show: the parking offers none, none was applied and nothing is suggested.
  bool get empty => options.isEmpty && surcharges.isEmpty && suggestion == null;

  factory BookingSurcharges.fromJson(Map<String, dynamic> j) => BookingSurcharges(
    surcharges: [for (final s in (j['surcharges'] as List? ?? const [])) AppliedSurcharge.fromJson(s as Map<String, dynamic>)],
    options: [for (final o in (j['options'] as List? ?? const [])) SurchargeOption.fromJson(o as Map<String, dynamic>)],
    suggestion: j['suggestion'] is Map<String, dynamic> ? LateSuggestion.fromJson(j['suggestion'] as Map<String, dynamic>) : null,
    totalCents: (j['totalCents'] as num?)?.toInt() ?? 0,
    canEdit: j['canEdit'] == true,
  );
}

abstract class SurchargesDataSource {
  Future<BookingSurcharges> list(String reservationId);

  /// `key` of a supplement the parking offers, or `label` + `amountCents` for « Autre montant… ».
  Future<BookingSurcharges> add(String reservationId, {String? key, String? label, int? amountCents});
  Future<BookingSurcharges> remove(String reservationId, String surchargeId);

  /// « Non » to the late-arrival suggestion.
  Future<BookingSurcharges> dismiss(String reservationId);
}

/// GET/POST /internal/reservations/:id/surcharges, DELETE …/:surchargeId, POST …/dismiss (`reservations:status` to write);
/// every write answers the whole block again.
class SurchargesDataSourceImpl implements SurchargesDataSource {
  SurchargesDataSourceImpl(this._dio);
  final Dio _dio;

  BookingSurcharges _read(Response<Map<String, dynamic>> res) => BookingSurcharges.fromJson(res.data ?? const {});

  @override
  Future<BookingSurcharges> list(String reservationId) async =>
      _read(await _dio.get<Map<String, dynamic>>('internal/reservations/$reservationId/surcharges'));

  @override
  Future<BookingSurcharges> add(String reservationId, {String? key, String? label, int? amountCents}) async => _read(
    await _dio.post<Map<String, dynamic>>(
      'internal/reservations/$reservationId/surcharges',
      data: key != null ? {'key': key} : {'label': label, 'amountCents': amountCents},
    ),
  );

  @override
  Future<BookingSurcharges> remove(String reservationId, String surchargeId) async =>
      _read(await _dio.delete<Map<String, dynamic>>('internal/reservations/$reservationId/surcharges/$surchargeId'));

  @override
  Future<BookingSurcharges> dismiss(String reservationId) async =>
      _read(await _dio.post<Map<String, dynamic>>('internal/reservations/$reservationId/surcharges/dismiss'));
}

import 'package:dio/dio.dart';

/// « Services à faire » (29/10/2026, direction C): one service a traveller ordered on Plazo, with the car it is for and
/// the time it has to be done by (one hour before the expected return).
class ExtrasBoardRow {
  const ExtrasBoardRow({
    required this.id,
    required this.kind,
    required this.label,
    required this.priceCents,
    required this.status,
    required this.dueAt,
    required this.late,
    required this.reservationId,
    required this.customerName,
    required this.plate,
    required this.returnAt,
    required this.expectedReturnAt,
    this.acceptedAt,
    this.acceptedBy,
    this.doneAt,
    this.doneBy,
    this.refusedAt,
    this.refusedBy,
    this.refusedReason,
    this.vehicleModel,
    this.vehicleColour,
    this.returnFlight,
    this.spot,
    this.fileCode,
    this.fileRank,
  });

  final String id;
  final String kind;
  final String label;
  final int priceCents;
  final String status;
  final DateTime dueAt;
  final bool late;
  final DateTime? acceptedAt;
  final String? acceptedBy;
  final DateTime? doneAt;
  final String? doneBy;
  final DateTime? refusedAt;
  final String? refusedBy;
  final String? refusedReason;
  final String reservationId;
  final String customerName;
  final String plate;
  final String? vehicleModel;
  final String? vehicleColour;
  final DateTime returnAt;
  final DateTime expectedReturnAt;
  final String? returnFlight;
  final String? spot;
  final String? fileCode;
  final int? fileRank;

  bool get accepted => acceptedAt != null;

  static DateTime? _date(Object? v) => v is String ? DateTime.tryParse(v)?.toLocal() : null;

  factory ExtrasBoardRow.fromJson(Map<String, dynamic> json) {
    final r = json['reservation'] is Map<String, dynamic> ? json['reservation'] as Map<String, dynamic> : const <String, dynamic>{};
    final file = r['file'] is Map<String, dynamic> ? r['file'] as Map<String, dynamic> : null;
    final returnAt = _date(r['returnAt']) ?? DateTime.now();
    return ExtrasBoardRow(
      id: json['id'] as String,
      kind: json['kind'] as String? ?? '',
      label: json['label'] as String? ?? '',
      priceCents: (json['priceCents'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'ordered',
      dueAt: _date(json['dueAt']) ?? returnAt,
      late: json['late'] == true,
      acceptedAt: _date(json['acceptedAt']),
      acceptedBy: json['acceptedBy'] as String?,
      doneAt: _date(json['doneAt']),
      doneBy: json['doneBy'] as String?,
      refusedAt: _date(json['refusedAt']),
      refusedBy: json['refusedBy'] as String?,
      refusedReason: json['refusedReason'] as String?,
      reservationId: r['id'] as String? ?? '',
      customerName: r['customerName'] as String? ?? '',
      plate: r['plate'] as String? ?? '',
      vehicleModel: r['vehicleModel'] as String?,
      vehicleColour: r['vehicleColour'] as String?,
      returnAt: returnAt,
      expectedReturnAt: _date(r['expectedReturnAt']) ?? returnAt,
      returnFlight: r['returnFlight'] as String?,
      spot: r['spot'] as String?,
      fileCode: file?['code'] as String?,
      fileRank: (file?['rank'] as num?)?.toInt(),
    );
  }
}

/// GET /internal/extras?view=todo|done|refused.
class ExtrasBoard {
  const ExtrasBoard({required this.view, required this.timezone, required this.now, required this.counts, required this.rows});

  final String view;
  final String timezone;
  final DateTime now;
  final Map<String, int> counts;
  final List<ExtrasBoardRow> rows;

  factory ExtrasBoard.fromJson(Map<String, dynamic> json) {
    final counts = json['counts'] is Map<String, dynamic> ? json['counts'] as Map<String, dynamic> : const <String, dynamic>{};
    return ExtrasBoard(
      view: json['view'] as String? ?? 'todo',
      timezone: json['timezone'] as String? ?? 'Europe/Paris',
      now: (json['now'] is String ? DateTime.tryParse(json['now'] as String)?.toLocal() : null) ?? DateTime.now(),
      counts: {for (final k in const ['todo', 'done', 'refused']) k: (counts[k] as num?)?.toInt() ?? 0},
      rows: [for (final r in (json['data'] as List<dynamic>? ?? const [])) ExtrasBoardRow.fromJson(r as Map<String, dynamic>)],
    );
  }
}

abstract class ExtrasBoardDataSource {
  Future<ExtrasBoard> fetch(String view);

  /// `accept`, `done` or `refuse` (with an optional [reason]).
  Future<void> act(ExtrasBoardRow row, String action, {String? reason});
}

class ExtrasBoardDataSourceImpl implements ExtrasBoardDataSource {
  ExtrasBoardDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<ExtrasBoard> fetch(String view) async {
    final res = await _dio.get<Map<String, dynamic>>('internal/extras', queryParameters: {'view': view});
    return ExtrasBoard.fromJson(res.data ?? const {});
  }

  @override
  Future<void> act(ExtrasBoardRow row, String action, {String? reason}) async {
    await _dio.post<Map<String, dynamic>>(
      'internal/reservations/${row.reservationId}/extras/${row.id}/$action',
      data: action == 'refuse' ? {if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim()} : null,
    );
  }
}

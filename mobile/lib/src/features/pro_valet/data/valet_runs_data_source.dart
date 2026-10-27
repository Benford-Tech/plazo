import 'package:dio/dio.dart';

/// « Voiturier au terminal » (27/10/2026, direction B): a run of the valets. Arrival: meet the traveller at the
/// terminal and take the car (« Sur place »); departure: bring it back there (« Rendu »).
class ValetRun {
  const ValetRun({
    required this.id,
    required this.reservationId,
    required this.kind,
    required this.state,
    required this.meetAt,
    required this.leaveAt,
    required this.mine,
    required this.customerName,
    required this.customerPhone,
    required this.plate,
    required this.passengers,
    this.takenBy,
    this.flight,
    this.flightLandedAt,
    this.departureFlight,
    this.spot,
    this.file,
    this.keyHook,
  });

  final String id;
  final String reservationId;

  /// `arrival` or `departure`.
  final String kind;

  /// `todo`, `taken` or `done`.
  final String state;
  final DateTime meetAt;
  final DateTime leaveAt;
  final bool mine;
  final String? takenBy;
  final String customerName;
  final String customerPhone;
  final String plate;
  final int passengers;
  final String? flight;
  final DateTime? flightLandedAt;
  final String? departureFlight;
  final String? spot;
  final String? file;
  final String? keyHook;

  bool get arrival => kind == 'arrival';

  static DateTime? _date(Object? v) => v is String ? DateTime.tryParse(v)?.toLocal() : null;

  factory ValetRun.fromJson(Map<String, dynamic> json) {
    final flight = json['flight'] is Map<String, dynamic> ? json['flight'] as Map<String, dynamic> : const <String, dynamic>{};
    final takenBy = json['takenBy'] is Map<String, dynamic> ? json['takenBy'] as Map<String, dynamic> : null;
    return ValetRun(
      id: json['id'] as String,
      reservationId: json['reservationId'] as String,
      kind: json['kind'] as String? ?? 'arrival',
      state: json['state'] as String? ?? 'todo',
      meetAt: _date(json['meetAt']) ?? DateTime.now(),
      leaveAt: _date(json['leaveAt']) ?? DateTime.now(),
      mine: json['mine'] == true,
      takenBy: takenBy?['firstName'] as String?,
      customerName: json['customerName'] as String? ?? '',
      customerPhone: json['customerPhone'] as String? ?? '',
      plate: json['plate'] as String? ?? '',
      passengers: (json['passengers'] as num?)?.toInt() ?? 1,
      flight: flight['number'] as String?,
      flightLandedAt: _date(flight['landedAt']),
      departureFlight: json['departureFlight'] as String?,
      spot: json['spot'] as String?,
      file: json['file'] as String?,
      keyHook: json['keyHook'] as String?,
    );
  }
}

/// GET /internal/valet/runs: the runs around today and the parking's meeting point.
class ValetRunsModel {
  const ValetRunsModel({required this.meetingPoint, required this.runs});

  final String meetingPoint;
  final List<ValetRun> runs;

  factory ValetRunsModel.fromJson(Map<String, dynamic> json) => ValetRunsModel(
    meetingPoint: json['meetingPoint'] as String? ?? '',
    runs: [for (final r in (json['runs'] as List<dynamic>? ?? const [])) ValetRun.fromJson(r as Map<String, dynamic>)],
  );
}

abstract class ValetRunsDataSource {
  Future<ValetRunsModel> fetch();

  /// `take` (« Je prends »), `release` (« Je ne peux plus ») or `done`.
  Future<void> act(ValetRun run, String action);
}

class ValetRunsDataSourceImpl implements ValetRunsDataSource {
  ValetRunsDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<ValetRunsModel> fetch() async {
    final res = await _dio.get<Map<String, dynamic>>('internal/valet/runs');
    return ValetRunsModel.fromJson(res.data ?? const {});
  }

  @override
  Future<void> act(ValetRun run, String action) async {
    await _dio.post<Map<String, dynamic>>('internal/valet/runs/${run.reservationId}/${run.kind}/$action');
  }
}

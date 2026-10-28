import 'package:dio/dio.dart';

/// One local day of GET /internal/planning/forecast (« planning prévisionnel », 28/10/2026).
class ForecastDay {
  const ForecastDay({
    required this.date,
    required this.arrivals,
    required this.returns,
    required this.parked,
    required this.bookable,
    required this.overbooked,
  });

  final String date;
  final int arrivals;

  /// Cars going home that day (« Départs » on screen).
  final int returns;

  /// Cars parked the night of that day, against the real capacity (margin included).
  final int parked;
  final int bookable;
  final bool overbooked;

  factory ForecastDay.fromJson(Map<String, dynamic> json) => ForecastDay(
    date: json['date'] as String,
    arrivals: (json['arrivals'] as num?)?.toInt() ?? 0,
    returns: (json['returns'] as num?)?.toInt() ?? 0,
    parked: (json['parked'] as num?)?.toInt() ?? 0,
    bookable: (json['bookable'] as num?)?.toInt() ?? 0,
    overbooked: json['overbooked'] == true,
  );
}

class ForecastModel {
  const ForecastModel({required this.today, required this.days});

  /// The parking's local date (YYYY-MM-DD).
  final String today;
  final List<ForecastDay> days;

  factory ForecastModel.fromJson(Map<String, dynamic> json) => ForecastModel(
    today: json['today'] as String? ?? '',
    days: [for (final d in (json['days'] as List<dynamic>? ?? const [])) ForecastDay.fromJson(d as Map<String, dynamic>)],
  );
}

abstract class ForecastDataSource {
  Future<ForecastModel> fetch(String from, int days);
}

class ForecastDataSourceImpl implements ForecastDataSource {
  ForecastDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<ForecastModel> fetch(String from, int days) async {
    final res = await _dio.get<Map<String, dynamic>>('internal/planning/forecast', queryParameters: {'from': from, 'days': days});
    return ForecastModel.fromJson(res.data ?? const {});
  }
}

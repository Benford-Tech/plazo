import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/revenue_models.dart';

part 'revenue_client.g.dart';

@RestApi()
abstract class RevenueClient {
  factory RevenueClient(Dio dio, {String? baseUrl}) = _RevenueClient;

  /// The dashboard's tile: this month, today and the last 7 days (managers only).
  @GET('internal/revenue/summary')
  Future<RevenueSummaryModel> summary();

  /// A period's revenue: two local dates, by `arrival` or `booked`.
  @GET('internal/revenue')
  Future<RevenueReportModel> report(@Query('from') String from, @Query('to') String to, @Query('basis') String basis);

  /// The amount of a booking that has none (never a Plazo booking's: `price_locked`).
  @PUT('internal/reservations/{id}/price')
  Future<void> setPrice(@Path('id') String id, @Body() Map<String, dynamic> body);
}

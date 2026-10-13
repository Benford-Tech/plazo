import 'package:freezed_annotation/freezed_annotation.dart';

part 'revenue_models.freezed.dart';
part 'revenue_models.g.dart';

/// GET /internal/revenue/summary (CA-A, 09/10/2026): the dashboard's tile, by arrival, for the managers.
@freezed
abstract class RevenueSummaryModel with _$RevenueSummaryModel {
  const factory RevenueSummaryModel({
    /// The parking's local date the figures stop at (YYYY-MM-DD).
    required String today,
    required RevenueMonthModel month,
    @Default(0) int todayCents,
    @Default(0) int weekCents,
  }) = _RevenueSummaryModel;

  factory RevenueSummaryModel.fromJson(Map<String, dynamic> json) => _$RevenueSummaryModelFromJson(json);
}

@freezed
abstract class RevenueMonthModel with _$RevenueMonthModel {
  const factory RevenueMonthModel({
    required String from,
    required String to,
    @Default(0) int totalCents,
    @Default(0) int count,
    @Default(0) int withoutAmount,
  }) = _RevenueMonthModel;

  factory RevenueMonthModel.fromJson(Map<String, dynamic> json) => _$RevenueMonthModelFromJson(json);
}

/// GET /internal/revenue (CA-B): a period's revenue, counted by arrival or by booking day, cancelled ones left out.
@freezed
abstract class RevenueReportModel with _$RevenueReportModel {
  const factory RevenueReportModel({
    required String from,
    required String to,
    @Default('arrival') String basis,
    String? timezone,

    /// The parking's local date now (13/10/2026); older servers leave it out.
    String? today,
    @Default(0) int totalCents,

    /// Bookings with an amount.
    @Default(0) int count,
    int? averageCents,
    double? averageDays,

    /// Bookings of the period without an amount: not counted.
    @Default(0) int withoutAmount,
    @Default([]) List<RevenueChannelModel> byChannel,
    @Default([]) List<RevenueDayModel> byDay,

    /// The most recent bookings without an amount (50 at most).
    @Default([]) List<RevenueMissingModel> missing,
  }) = _RevenueReportModel;

  factory RevenueReportModel.fromJson(Map<String, dynamic> json) => _$RevenueReportModelFromJson(json);
}

/// One line of « Par canal »: a channel, and for comparators their name (« Allopark »…).
@freezed
abstract class RevenueChannelModel with _$RevenueChannelModel {
  const factory RevenueChannelModel({required String channel, String? detail, @Default(0) int count, @Default(0) int totalCents}) = _RevenueChannelModel;

  factory RevenueChannelModel.fromJson(Map<String, dynamic> json) => _$RevenueChannelModelFromJson(json);
}

@freezed
abstract class RevenueDayModel with _$RevenueDayModel {
  const factory RevenueDayModel({required String date, @Default(0) int count, @Default(0) int totalCents}) = _RevenueDayModel;

  factory RevenueDayModel.fromJson(Map<String, dynamic> json) => _$RevenueDayModelFromJson(json);
}

/// A booking of the period without an amount, to complete.
@freezed
abstract class RevenueMissingModel with _$RevenueMissingModel {
  const factory RevenueMissingModel({
    required String id,
    required String reference,
    @Default('') String customerName,
    String? plate,
    required DateTime arrivalAt,
    required String channel,
    String? detail,
  }) = _RevenueMissingModel;

  factory RevenueMissingModel.fromJson(Map<String, dynamic> json) => _$RevenueMissingModelFromJson(json);
}

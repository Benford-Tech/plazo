// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'revenue_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_RevenueSummaryModel _$RevenueSummaryModelFromJson(Map<String, dynamic> json) =>
    _RevenueSummaryModel(
      today: json['today'] as String,
      month: RevenueMonthModel.fromJson(json['month'] as Map<String, dynamic>),
      todayCents: (json['todayCents'] as num?)?.toInt() ?? 0,
      weekCents: (json['weekCents'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$RevenueSummaryModelToJson(
  _RevenueSummaryModel instance,
) => <String, dynamic>{
  'today': instance.today,
  'month': instance.month,
  'todayCents': instance.todayCents,
  'weekCents': instance.weekCents,
};

_RevenueMonthModel _$RevenueMonthModelFromJson(Map<String, dynamic> json) =>
    _RevenueMonthModel(
      from: json['from'] as String,
      to: json['to'] as String,
      totalCents: (json['totalCents'] as num?)?.toInt() ?? 0,
      count: (json['count'] as num?)?.toInt() ?? 0,
      withoutAmount: (json['withoutAmount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$RevenueMonthModelToJson(_RevenueMonthModel instance) =>
    <String, dynamic>{
      'from': instance.from,
      'to': instance.to,
      'totalCents': instance.totalCents,
      'count': instance.count,
      'withoutAmount': instance.withoutAmount,
    };

_RevenueReportModel _$RevenueReportModelFromJson(
  Map<String, dynamic> json,
) => _RevenueReportModel(
  from: json['from'] as String,
  to: json['to'] as String,
  basis: json['basis'] as String? ?? 'arrival',
  timezone: json['timezone'] as String?,
  today: json['today'] as String?,
  totalCents: (json['totalCents'] as num?)?.toInt() ?? 0,
  count: (json['count'] as num?)?.toInt() ?? 0,
  averageCents: (json['averageCents'] as num?)?.toInt(),
  averageDays: (json['averageDays'] as num?)?.toDouble(),
  withoutAmount: (json['withoutAmount'] as num?)?.toInt() ?? 0,
  byChannel:
      (json['byChannel'] as List<dynamic>?)
          ?.map((e) => RevenueChannelModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  byDay:
      (json['byDay'] as List<dynamic>?)
          ?.map((e) => RevenueDayModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  missing:
      (json['missing'] as List<dynamic>?)
          ?.map((e) => RevenueMissingModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$RevenueReportModelToJson(_RevenueReportModel instance) =>
    <String, dynamic>{
      'from': instance.from,
      'to': instance.to,
      'basis': instance.basis,
      'timezone': instance.timezone,
      'today': instance.today,
      'totalCents': instance.totalCents,
      'count': instance.count,
      'averageCents': instance.averageCents,
      'averageDays': instance.averageDays,
      'withoutAmount': instance.withoutAmount,
      'byChannel': instance.byChannel,
      'byDay': instance.byDay,
      'missing': instance.missing,
    };

_RevenueChannelModel _$RevenueChannelModelFromJson(Map<String, dynamic> json) =>
    _RevenueChannelModel(
      channel: json['channel'] as String,
      detail: json['detail'] as String?,
      count: (json['count'] as num?)?.toInt() ?? 0,
      totalCents: (json['totalCents'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$RevenueChannelModelToJson(
  _RevenueChannelModel instance,
) => <String, dynamic>{
  'channel': instance.channel,
  'detail': instance.detail,
  'count': instance.count,
  'totalCents': instance.totalCents,
};

_RevenueDayModel _$RevenueDayModelFromJson(Map<String, dynamic> json) =>
    _RevenueDayModel(
      date: json['date'] as String,
      count: (json['count'] as num?)?.toInt() ?? 0,
      totalCents: (json['totalCents'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$RevenueDayModelToJson(_RevenueDayModel instance) =>
    <String, dynamic>{
      'date': instance.date,
      'count': instance.count,
      'totalCents': instance.totalCents,
    };

_RevenueMissingModel _$RevenueMissingModelFromJson(Map<String, dynamic> json) =>
    _RevenueMissingModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      customerName: json['customerName'] as String? ?? '',
      plate: json['plate'] as String?,
      arrivalAt: DateTime.parse(json['arrivalAt'] as String),
      channel: json['channel'] as String,
      detail: json['detail'] as String?,
    );

Map<String, dynamic> _$RevenueMissingModelToJson(
  _RevenueMissingModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'reference': instance.reference,
  'customerName': instance.customerName,
  'plate': instance.plate,
  'arrivalAt': instance.arrivalAt.toIso8601String(),
  'channel': instance.channel,
  'detail': instance.detail,
};

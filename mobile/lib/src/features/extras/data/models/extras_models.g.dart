// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'extras_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ExtraOfferModel _$ExtraOfferModelFromJson(Map<String, dynamic> json) =>
    _ExtraOfferModel(
      kind: json['kind'] as String,
      label: json['label'] as String,
      description: json['description'] as String? ?? '',
      priceCents: (json['priceCents'] as num).toInt(),
      available: json['available'] as bool? ?? true,
      reason: json['reason'] as String?,
    );

Map<String, dynamic> _$ExtraOfferModelToJson(_ExtraOfferModel instance) =>
    <String, dynamic>{
      'kind': instance.kind,
      'label': instance.label,
      'description': instance.description,
      'priceCents': instance.priceCents,
      'available': instance.available,
      'reason': instance.reason,
    };

_ExtraOrderModel _$ExtraOrderModelFromJson(Map<String, dynamic> json) =>
    _ExtraOrderModel(
      id: json['id'] as String,
      kind: json['kind'] as String,
      label: json['label'] as String,
      priceCents: (json['priceCents'] as num).toInt(),
      status: json['status'] as String,
      withBooking: json['withBooking'] as bool? ?? false,
      paidAt: json['paidAt'] == null
          ? null
          : DateTime.parse(json['paidAt'] as String),
      doneAt: json['doneAt'] == null
          ? null
          : DateTime.parse(json['doneAt'] as String),
      refusedAt: json['refusedAt'] == null
          ? null
          : DateTime.parse(json['refusedAt'] as String),
      refusedReason: json['refusedReason'] as String?,
      refundedAt: json['refundedAt'] == null
          ? null
          : DateTime.parse(json['refundedAt'] as String),
      doneBy: json['doneBy'] as String?,
      refusedBy: json['refusedBy'] as String?,
    );

Map<String, dynamic> _$ExtraOrderModelToJson(_ExtraOrderModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'kind': instance.kind,
      'label': instance.label,
      'priceCents': instance.priceCents,
      'status': instance.status,
      'withBooking': instance.withBooking,
      'paidAt': instance.paidAt?.toIso8601String(),
      'doneAt': instance.doneAt?.toIso8601String(),
      'refusedAt': instance.refusedAt?.toIso8601String(),
      'refusedReason': instance.refusedReason,
      'refundedAt': instance.refundedAt?.toIso8601String(),
      'doneBy': instance.doneBy,
      'refusedBy': instance.refusedBy,
    };

_TravellerExtrasModel _$TravellerExtrasModelFromJson(
  Map<String, dynamic> json,
) => _TravellerExtrasModel(
  offers:
      (json['offers'] as List<dynamic>?)
          ?.map((e) => ExtraOfferModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <ExtraOfferModel>[],
  orders:
      (json['orders'] as List<dynamic>?)
          ?.map((e) => ExtraOrderModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <ExtraOrderModel>[],
  orderUntil: json['orderUntil'] == null
      ? null
      : DateTime.parse(json['orderUntil'] as String),
  canOrder: json['canOrder'] as bool? ?? false,
);

Map<String, dynamic> _$TravellerExtrasModelToJson(
  _TravellerExtrasModel instance,
) => <String, dynamic>{
  'offers': instance.offers,
  'orders': instance.orders,
  'orderUntil': instance.orderUntil?.toIso8601String(),
  'canOrder': instance.canOrder,
};

_ExtraPaymentModel _$ExtraPaymentModelFromJson(Map<String, dynamic> json) =>
    _ExtraPaymentModel(
      clientSecret: json['clientSecret'] as String?,
      paymentIntentId: json['paymentIntentId'] as String?,
      amountCents: (json['amountCents'] as num?)?.toInt(),
      currency: json['currency'] as String? ?? 'eur',
      paid: json['paid'] as bool? ?? false,
    );

Map<String, dynamic> _$ExtraPaymentModelToJson(_ExtraPaymentModel instance) =>
    <String, dynamic>{
      'clientSecret': instance.clientSecret,
      'paymentIntentId': instance.paymentIntentId,
      'amountCents': instance.amountCents,
      'currency': instance.currency,
      'paid': instance.paid,
    };

_ExtraOrderResponseModel _$ExtraOrderResponseModelFromJson(
  Map<String, dynamic> json,
) => _ExtraOrderResponseModel(
  extra: ExtraOrderModel.fromJson(json['extra'] as Map<String, dynamic>),
  payment: ExtraPaymentModel.fromJson(json['payment'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ExtraOrderResponseModelToJson(
  _ExtraOrderResponseModel instance,
) => <String, dynamic>{'extra': instance.extra, 'payment': instance.payment};

_StaffExtrasModel _$StaffExtrasModelFromJson(Map<String, dynamic> json) =>
    _StaffExtrasModel(
      extras:
          (json['extras'] as List<dynamic>?)
              ?.map((e) => ExtraOrderModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <ExtraOrderModel>[],
    );

Map<String, dynamic> _$StaffExtrasModelToJson(_StaffExtrasModel instance) =>
    <String, dynamic>{'extras': instance.extras};

_ExtraSettingModel _$ExtraSettingModelFromJson(Map<String, dynamic> json) =>
    _ExtraSettingModel(
      kind: json['kind'] as String,
      label: json['label'] as String,
      description: json['description'] as String? ?? '',
      enabled: json['enabled'] as bool? ?? false,
      priceCents: (json['priceCents'] as num).toInt(),
      defaultPriceCents: (json['defaultPriceCents'] as num?)?.toInt(),
    );

Map<String, dynamic> _$ExtraSettingModelToJson(_ExtraSettingModel instance) =>
    <String, dynamic>{
      'kind': instance.kind,
      'label': instance.label,
      'description': instance.description,
      'enabled': instance.enabled,
      'priceCents': instance.priceCents,
      'defaultPriceCents': instance.defaultPriceCents,
    };

_ExtraSettingsModel _$ExtraSettingsModelFromJson(Map<String, dynamic> json) =>
    _ExtraSettingsModel(
      leadHours: (json['leadHours'] as num?)?.toInt() ?? 24,
      offers:
          (json['offers'] as List<dynamic>?)
              ?.map(
                (e) => ExtraSettingModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const <ExtraSettingModel>[],
    );

Map<String, dynamic> _$ExtraSettingsModelToJson(_ExtraSettingsModel instance) =>
    <String, dynamic>{
      'leadHours': instance.leadHours,
      'offers': instance.offers,
    };

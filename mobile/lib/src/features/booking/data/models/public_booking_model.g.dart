// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_booking_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PublicBookingModel _$PublicBookingModelFromJson(
  Map<String, dynamic> json,
) => _PublicBookingModel(
  reference: json['reference'] as String,
  status: json['status'] as String,
  paymentMode: json['paymentMode'] as String? ?? 'on_site',
  payment: json['payment'] == null
      ? null
      : BookingPaymentModel.fromJson(json['payment'] as Map<String, dynamic>),
  parking: BookingParkingModel.fromJson(
    json['parking'] as Map<String, dynamic>,
  ),
  arrivalAt: json['arrivalAt'] as String,
  returnAt: json['returnAt'] as String,
  customerName: json['customerName'] as String,
  customerEmail: json['customerEmail'] as String?,
  customerPhone: json['customerPhone'] as String? ?? '',
  plate: json['plate'] as String,
  returnFlight: json['returnFlight'] as String?,
  departureFlight: json['departureFlight'] as String?,
  outbound: json['outbound'] == null
      ? null
      : OutboundFlightModel.fromJson(json['outbound'] as Map<String, dynamic>),
  passengers: (json['passengers'] as num).toInt(),
  days: (json['days'] as num?)?.toInt(),
  priceCents: (json['priceCents'] as num?)?.toInt(),
  cancellationPolicy: json['cancellationPolicy'] as String? ?? 'non_refundable',
  cancellableUntil: json['cancellableUntil'] as String?,
  canCancel: json['canCancel'] as bool? ?? false,
  canEditFlight: json['canEditFlight'] as bool? ?? false,
);

Map<String, dynamic> _$PublicBookingModelToJson(_PublicBookingModel instance) =>
    <String, dynamic>{
      'reference': instance.reference,
      'status': instance.status,
      'paymentMode': instance.paymentMode,
      'payment': instance.payment,
      'parking': instance.parking,
      'arrivalAt': instance.arrivalAt,
      'returnAt': instance.returnAt,
      'customerName': instance.customerName,
      'customerEmail': instance.customerEmail,
      'customerPhone': instance.customerPhone,
      'plate': instance.plate,
      'returnFlight': instance.returnFlight,
      'departureFlight': instance.departureFlight,
      'outbound': instance.outbound,
      'passengers': instance.passengers,
      'days': instance.days,
      'priceCents': instance.priceCents,
      'cancellationPolicy': instance.cancellationPolicy,
      'cancellableUntil': instance.cancellableUntil,
      'canCancel': instance.canCancel,
      'canEditFlight': instance.canEditFlight,
    };

_BookingPaymentModel _$BookingPaymentModelFromJson(Map<String, dynamic> json) =>
    _BookingPaymentModel(
      status: json['status'] as String,
      holdExpiresAt: json['holdExpiresAt'] as String?,
      holdSecondsLeft: (json['holdSecondsLeft'] as num?)?.toInt(),
    );

Map<String, dynamic> _$BookingPaymentModelToJson(
  _BookingPaymentModel instance,
) => <String, dynamic>{
  'status': instance.status,
  'holdExpiresAt': instance.holdExpiresAt,
  'holdSecondsLeft': instance.holdSecondsLeft,
};

_BookingParkingModel _$BookingParkingModelFromJson(Map<String, dynamic> json) =>
    _BookingParkingModel(
      title: json['title'] as String,
      slug: json['slug'] as String?,
      address: json['address'] as String?,
      shuttleMinutes: (json['shuttleMinutes'] as num?)?.toInt(),
      openingHours: json['openingHours'] as String?,
      phone: json['phone'] as String?,
      airport: json['airport'] == null
          ? null
          : BookingAirportModel.fromJson(
              json['airport'] as Map<String, dynamic>,
            ),
    );

Map<String, dynamic> _$BookingParkingModelToJson(
  _BookingParkingModel instance,
) => <String, dynamic>{
  'title': instance.title,
  'slug': instance.slug,
  'address': instance.address,
  'shuttleMinutes': instance.shuttleMinutes,
  'openingHours': instance.openingHours,
  'phone': instance.phone,
  'airport': instance.airport,
};

_BookingAirportModel _$BookingAirportModelFromJson(Map<String, dynamic> json) =>
    _BookingAirportModel(
      slug: json['slug'] as String,
      name: json['name'] as String,
    );

Map<String, dynamic> _$BookingAirportModelToJson(
  _BookingAirportModel instance,
) => <String, dynamic>{'slug': instance.slug, 'name': instance.name};

_BookingAccessModel _$BookingAccessModelFromJson(Map<String, dynamic> json) =>
    _BookingAccessModel(
      reference: json['reference'] as String,
      manageToken: json['manageToken'] as String,
    );

Map<String, dynamic> _$BookingAccessModelToJson(_BookingAccessModel instance) =>
    <String, dynamic>{
      'reference': instance.reference,
      'manageToken': instance.manageToken,
    };

_CreatedBookingModel _$CreatedBookingModelFromJson(Map<String, dynamic> json) =>
    _CreatedBookingModel(
      reference: json['reference'] as String,
      manageToken: json['manageToken'] as String,
      booking: PublicBookingModel.fromJson(
        json['booking'] as Map<String, dynamic>,
      ),
    );

Map<String, dynamic> _$CreatedBookingModelToJson(
  _CreatedBookingModel instance,
) => <String, dynamic>{
  'reference': instance.reference,
  'manageToken': instance.manageToken,
  'booking': instance.booking,
};

_PaymentIntentModel _$PaymentIntentModelFromJson(Map<String, dynamic> json) =>
    _PaymentIntentModel(
      clientSecret: json['clientSecret'] as String?,
      paymentIntentId: json['paymentIntentId'] as String?,
      amountCents: (json['amountCents'] as num?)?.toInt(),
      currency: json['currency'] as String?,
      holdExpiresAt: json['holdExpiresAt'] as String?,
      paid: json['paid'] as bool? ?? false,
    );

Map<String, dynamic> _$PaymentIntentModelToJson(_PaymentIntentModel instance) =>
    <String, dynamic>{
      'clientSecret': instance.clientSecret,
      'paymentIntentId': instance.paymentIntentId,
      'amountCents': instance.amountCents,
      'currency': instance.currency,
      'holdExpiresAt': instance.holdExpiresAt,
      'paid': instance.paid,
    };

_CheckoutModel _$CheckoutModelFromJson(Map<String, dynamic> json) =>
    _CheckoutModel(
      url: json['url'] as String?,
      paid: json['paid'] as bool? ?? false,
    );

Map<String, dynamic> _$CheckoutModelToJson(_CheckoutModel instance) =>
    <String, dynamic>{'url': instance.url, 'paid': instance.paid};

_OutboundFlightModel _$OutboundFlightModelFromJson(Map<String, dynamic> json) =>
    _OutboundFlightModel(
      status: json['status'] as String?,
      scheduledAt: json['scheduledAt'] as String?,
      estimatedAt: json['estimatedAt'] as String?,
      terminal: json['terminal'] as String?,
      shuttleAt: json['shuttleAt'] as String?,
    );

Map<String, dynamic> _$OutboundFlightModelToJson(
  _OutboundFlightModel instance,
) => <String, dynamic>{
  'status': instance.status,
  'scheduledAt': instance.scheduledAt,
  'estimatedAt': instance.estimatedAt,
  'terminal': instance.terminal,
  'shuttleAt': instance.shuttleAt,
};

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_booking_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PublicBookingModel _$PublicBookingModelFromJson(Map<String, dynamic> json) =>
    _PublicBookingModel(
      reference: json['reference'] as String,
      status: json['status'] as String,
      parking: BookingParkingModel.fromJson(
        json['parking'] as Map<String, dynamic>,
      ),
      arrivalAt: json['arrivalAt'] as String,
      returnAt: json['returnAt'] as String,
      customerName: json['customerName'] as String,
      plate: json['plate'] as String,
      returnFlight: json['returnFlight'] as String?,
      passengers: (json['passengers'] as num).toInt(),
      days: (json['days'] as num?)?.toInt(),
    );

Map<String, dynamic> _$PublicBookingModelToJson(_PublicBookingModel instance) =>
    <String, dynamic>{
      'reference': instance.reference,
      'status': instance.status,
      'parking': instance.parking,
      'arrivalAt': instance.arrivalAt,
      'returnAt': instance.returnAt,
      'customerName': instance.customerName,
      'plate': instance.plate,
      'returnFlight': instance.returnFlight,
      'passengers': instance.passengers,
      'days': instance.days,
    };

_BookingParkingModel _$BookingParkingModelFromJson(Map<String, dynamic> json) =>
    _BookingParkingModel(
      title: json['title'] as String,
      address: json['address'] as String?,
      shuttleMinutes: (json['shuttleMinutes'] as num?)?.toInt(),
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
  'address': instance.address,
  'shuttleMinutes': instance.shuttleMinutes,
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

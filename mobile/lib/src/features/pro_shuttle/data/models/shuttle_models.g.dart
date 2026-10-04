// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shuttle_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PickupRowModel _$PickupRowModelFromJson(Map<String, dynamic> json) =>
    _PickupRowModel(
      reservationId: json['reservationId'] as String,
      reference: json['reference'] as String,
      customerName: json['customerName'] as String,
      passengers: (json['passengers'] as num).toInt(),
      plate: json['plate'] as String,
      status: json['status'] as String,
      returnAt: DateTime.parse(json['returnAt'] as String),
      flight: json['flight'] == null
          ? const FlightViewModel()
          : FlightViewModel.fromJson(json['flight'] as Map<String, dynamic>),
      terminal: json['terminal'] as String?,
      atMeetingPointAt: json['atMeetingPointAt'] == null
          ? null
          : DateTime.parse(json['atMeetingPointAt'] as String),
      tripId: json['tripId'] as String?,
    );

Map<String, dynamic> _$PickupRowModelToJson(_PickupRowModel instance) =>
    <String, dynamic>{
      'reservationId': instance.reservationId,
      'reference': instance.reference,
      'customerName': instance.customerName,
      'passengers': instance.passengers,
      'plate': instance.plate,
      'status': instance.status,
      'returnAt': instance.returnAt.toIso8601String(),
      'flight': instance.flight,
      'terminal': instance.terminal,
      'atMeetingPointAt': instance.atMeetingPointAt?.toIso8601String(),
      'tripId': instance.tripId,
    };

_PickupsModel _$PickupsModelFromJson(Map<String, dynamic> json) =>
    _PickupsModel(
      serverTime: DateTime.parse(json['serverTime'] as String),
      meetingPoint: json['meetingPoint'] == null
          ? null
          : MeetingPointModel.fromJson(
              json['meetingPoint'] as Map<String, dynamic>,
            ),
      rows:
          (json['rows'] as List<dynamic>?)
              ?.map((e) => PickupRowModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$PickupsModelToJson(_PickupsModel instance) =>
    <String, dynamic>{
      'serverTime': instance.serverTime.toIso8601String(),
      'meetingPoint': instance.meetingPoint,
      'rows': instance.rows,
    };

_ShuttleVehicleModel _$ShuttleVehicleModelFromJson(Map<String, dynamic> json) =>
    _ShuttleVehicleModel(
      id: json['id'] as String,
      model: json['model'] as String,
      colour: json['colour'] as String?,
      plate: json['plate'] as String?,
      seats: (json['seats'] as num?)?.toInt(),
      inService: json['inService'] as bool? ?? true,
      driverId: json['driverId'] as String?,
      driverName: json['driverName'] as String?,
    );

Map<String, dynamic> _$ShuttleVehicleModelToJson(
  _ShuttleVehicleModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'model': instance.model,
  'colour': instance.colour,
  'plate': instance.plate,
  'seats': instance.seats,
  'inService': instance.inService,
  'driverId': instance.driverId,
  'driverName': instance.driverName,
};

_DepartureRowModel _$DepartureRowModelFromJson(Map<String, dynamic> json) =>
    _DepartureRowModel(
      reservationId: json['reservationId'] as String,
      reference: json['reference'] as String,
      customerName: json['customerName'] as String,
      passengers: (json['passengers'] as num).toInt(),
      plate: json['plate'] as String,
      status: json['status'] as String,
      arrivalAt: DateTime.parse(json['arrivalAt'] as String),
      arrivedAt: json['arrivedAt'] == null
          ? null
          : DateTime.parse(json['arrivedAt'] as String),
      spot: json['spot'] as String?,
      tripId: json['tripId'] as String?,
    );

Map<String, dynamic> _$DepartureRowModelToJson(_DepartureRowModel instance) =>
    <String, dynamic>{
      'reservationId': instance.reservationId,
      'reference': instance.reference,
      'customerName': instance.customerName,
      'passengers': instance.passengers,
      'plate': instance.plate,
      'status': instance.status,
      'arrivalAt': instance.arrivalAt.toIso8601String(),
      'arrivedAt': instance.arrivedAt?.toIso8601String(),
      'spot': instance.spot,
      'tripId': instance.tripId,
    };

_DeparturesModel _$DeparturesModelFromJson(Map<String, dynamic> json) =>
    _DeparturesModel(
      serverTime: DateTime.parse(json['serverTime'] as String),
      rows:
          (json['rows'] as List<dynamic>?)
              ?.map(
                (e) => DepartureRowModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
    );

Map<String, dynamic> _$DeparturesModelToJson(_DeparturesModel instance) =>
    <String, dynamic>{
      'serverTime': instance.serverTime.toIso8601String(),
      'rows': instance.rows,
    };

_TripPassengerModel _$TripPassengerModelFromJson(Map<String, dynamic> json) =>
    _TripPassengerModel(
      reservationId: json['reservationId'] as String,
      reference: json['reference'] as String,
      customerName: json['customerName'] as String,
      passengers: (json['passengers'] as num).toInt(),
      plate: json['plate'] as String,
      terminal: json['terminal'] as String?,
    );

Map<String, dynamic> _$TripPassengerModelToJson(_TripPassengerModel instance) =>
    <String, dynamic>{
      'reservationId': instance.reservationId,
      'reference': instance.reference,
      'customerName': instance.customerName,
      'passengers': instance.passengers,
      'plate': instance.plate,
      'terminal': instance.terminal,
    };

_StaffTripModel _$StaffTripModelFromJson(Map<String, dynamic> json) =>
    _StaffTripModel(
      id: json['id'] as String,
      status: json['status'] as String,
      direction: json['direction'] as String? ?? 'pickup',
      driverId: json['driverId'] as String,
      driverName: json['driverName'] as String,
      vehicle: json['vehicle'] == null
          ? const TripVehicleModel()
          : TripVehicleModel.fromJson(json['vehicle'] as Map<String, dynamic>),
      startedAt: DateTime.parse(json['startedAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      endedAt: json['endedAt'] == null
          ? null
          : DateTime.parse(json['endedAt'] as String),
      endReason: json['endReason'] as String?,
      secondsLeft: (json['secondsLeft'] as num?)?.toInt() ?? 0,
      passengers:
          (json['passengers'] as List<dynamic>?)
              ?.map(
                (e) => TripPassengerModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
      positionUpdatedAt: json['positionUpdatedAt'] == null
          ? null
          : DateTime.parse(json['positionUpdatedAt'] as String),
      meetingPoint: json['meetingPoint'] == null
          ? null
          : MeetingPointModel.fromJson(
              json['meetingPoint'] as Map<String, dynamic>,
            ),
    );

Map<String, dynamic> _$StaffTripModelToJson(_StaffTripModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'status': instance.status,
      'direction': instance.direction,
      'driverId': instance.driverId,
      'driverName': instance.driverName,
      'vehicle': instance.vehicle,
      'startedAt': instance.startedAt.toIso8601String(),
      'expiresAt': instance.expiresAt.toIso8601String(),
      'endedAt': instance.endedAt?.toIso8601String(),
      'endReason': instance.endReason,
      'secondsLeft': instance.secondsLeft,
      'passengers': instance.passengers,
      'positionUpdatedAt': instance.positionUpdatedAt?.toIso8601String(),
      'meetingPoint': instance.meetingPoint,
    };

_CurrentTripModel _$CurrentTripModelFromJson(Map<String, dynamic> json) =>
    _CurrentTripModel(
      trip: json['trip'] == null
          ? null
          : StaffTripModel.fromJson(json['trip'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CurrentTripModelToJson(_CurrentTripModel instance) =>
    <String, dynamic>{'trip': instance.trip};

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
      stopId: json['stopId'] as String?,
      stopName: json['stopName'] as String?,
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
      'stopId': instance.stopId,
      'stopName': instance.stopName,
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
      holderId: json['holderId'] as String?,
      holderName: json['holderName'] as String?,
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
  'holderId': instance.holderId,
  'holderName': instance.holderName,
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
      stopId: json['stopId'] as String?,
      stopName: json['stopName'] as String?,
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
      'stopId': instance.stopId,
      'stopName': instance.stopName,
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
      stop: json['stop'] == null
          ? null
          : ShuttleStopModel.fromJson(json['stop'] as Map<String, dynamic>),
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
      'stop': instance.stop,
    };

_ShuttleStopModel _$ShuttleStopModelFromJson(Map<String, dynamic> json) =>
    _ShuttleStopModel(
      id: json['id'] as String?,
      kind: json['kind'] as String? ?? 'other',
      name: json['name'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      instructions: json['instructions'] as String?,
      builtIn: json['builtIn'] as bool? ?? false,
    );

Map<String, dynamic> _$ShuttleStopModelToJson(_ShuttleStopModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'kind': instance.kind,
      'name': instance.name,
      'lat': instance.lat,
      'lng': instance.lng,
      'instructions': instance.instructions,
      'builtIn': instance.builtIn,
    };

_LiveEstimateModel _$LiveEstimateModelFromJson(Map<String, dynamic> json) =>
    _LiveEstimateModel(
      distanceM: (json['distanceM'] as num).toInt(),
      etaMinutes: (json['etaMinutes'] as num).toInt(),
    );

Map<String, dynamic> _$LiveEstimateModelToJson(_LiveEstimateModel instance) =>
    <String, dynamic>{
      'distanceM': instance.distanceM,
      'etaMinutes': instance.etaMinutes,
    };

_LiveTripModel _$LiveTripModelFromJson(
  Map<String, dynamic> json,
) => _LiveTripModel(
  id: json['id'] as String,
  direction: json['direction'] as String? ?? 'pickup',
  driverId: json['driverId'] as String,
  driverName: json['driverName'] as String,
  vehicle: json['vehicle'] == null
      ? const TripVehicleModel()
      : TripVehicleModel.fromJson(json['vehicle'] as Map<String, dynamic>),
  stop: json['stop'] == null
      ? null
      : ShuttleStopModel.fromJson(json['stop'] as Map<String, dynamic>),
  passengers: (json['passengers'] as num?)?.toInt() ?? 0,
  startedAt: DateTime.parse(json['startedAt'] as String),
  expiresAt: DateTime.parse(json['expiresAt'] as String),
  position: json['position'] == null
      ? null
      : ShuttlePositionModel.fromJson(json['position'] as Map<String, dynamic>),
  positionAgeSeconds: (json['positionAgeSeconds'] as num?)?.toInt(),
  toStop: json['toStop'] == null
      ? null
      : LiveEstimateModel.fromJson(json['toStop'] as Map<String, dynamic>),
  toParking: json['toParking'] == null
      ? null
      : LiveEstimateModel.fromJson(json['toParking'] as Map<String, dynamic>),
);

Map<String, dynamic> _$LiveTripModelToJson(_LiveTripModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'direction': instance.direction,
      'driverId': instance.driverId,
      'driverName': instance.driverName,
      'vehicle': instance.vehicle,
      'stop': instance.stop,
      'passengers': instance.passengers,
      'startedAt': instance.startedAt.toIso8601String(),
      'expiresAt': instance.expiresAt.toIso8601String(),
      'position': instance.position,
      'positionAgeSeconds': instance.positionAgeSeconds,
      'toStop': instance.toStop,
      'toParking': instance.toParking,
    };

_LiveParkingModel _$LiveParkingModelFromJson(Map<String, dynamic> json) =>
    _LiveParkingModel(
      id: json['id'] as String,
      name: json['name'] as String,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$LiveParkingModelToJson(_LiveParkingModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'lat': instance.lat,
      'lng': instance.lng,
    };

_LiveShuttlesModel _$LiveShuttlesModelFromJson(Map<String, dynamic> json) =>
    _LiveShuttlesModel(
      serverTime: DateTime.parse(json['serverTime'] as String),
      parking: LiveParkingModel.fromJson(
        json['parking'] as Map<String, dynamic>,
      ),
      stops:
          (json['stops'] as List<dynamic>?)
              ?.map((e) => ShuttleStopModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      trips:
          (json['trips'] as List<dynamic>?)
              ?.map((e) => LiveTripModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$LiveShuttlesModelToJson(_LiveShuttlesModel instance) =>
    <String, dynamic>{
      'serverTime': instance.serverTime.toIso8601String(),
      'parking': instance.parking,
      'stops': instance.stops,
      'trips': instance.trips,
    };

_CurrentTripModel _$CurrentTripModelFromJson(Map<String, dynamic> json) =>
    _CurrentTripModel(
      trip: json['trip'] == null
          ? null
          : StaffTripModel.fromJson(json['trip'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CurrentTripModelToJson(_CurrentTripModel instance) =>
    <String, dynamic>{'trip': instance.trip};

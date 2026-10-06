// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'return_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_FlightViewModel _$FlightViewModelFromJson(Map<String, dynamic> json) =>
    _FlightViewModel(
      number: json['number'] as String?,
      status: json['status'] as String?,
      scheduledAt: json['scheduledAt'] == null
          ? null
          : DateTime.parse(json['scheduledAt'] as String),
      estimatedAt: json['estimatedAt'] == null
          ? null
          : DateTime.parse(json['estimatedAt'] as String),
      landedAt: json['landedAt'] == null
          ? null
          : DateTime.parse(json['landedAt'] as String),
      landedSource: json['landedSource'] as String?,
      terminal: json['terminal'] as String?,
      gate: json['gate'] as String?,
      checkedAt: json['checkedAt'] == null
          ? null
          : DateTime.parse(json['checkedAt'] as String),
    );

Map<String, dynamic> _$FlightViewModelToJson(_FlightViewModel instance) =>
    <String, dynamic>{
      'number': instance.number,
      'status': instance.status,
      'scheduledAt': instance.scheduledAt?.toIso8601String(),
      'estimatedAt': instance.estimatedAt?.toIso8601String(),
      'landedAt': instance.landedAt?.toIso8601String(),
      'landedSource': instance.landedSource,
      'terminal': instance.terminal,
      'gate': instance.gate,
      'checkedAt': instance.checkedAt?.toIso8601String(),
    };

_TripVehicleModel _$TripVehicleModelFromJson(Map<String, dynamic> json) =>
    _TripVehicleModel(
      model: json['model'] as String?,
      colour: json['colour'] as String?,
      plate: json['plate'] as String?,
    );

Map<String, dynamic> _$TripVehicleModelToJson(_TripVehicleModel instance) =>
    <String, dynamic>{
      'model': instance.model,
      'colour': instance.colour,
      'plate': instance.plate,
    };

_ShuttlePositionModel _$ShuttlePositionModelFromJson(
  Map<String, dynamic> json,
) => _ShuttlePositionModel(
  lat: (json['lat'] as num).toDouble(),
  lng: (json['lng'] as num).toDouble(),
);

Map<String, dynamic> _$ShuttlePositionModelToJson(
  _ShuttlePositionModel instance,
) => <String, dynamic>{'lat': instance.lat, 'lng': instance.lng};

_TravellerShuttleModel _$TravellerShuttleModelFromJson(
  Map<String, dynamic> json,
) => _TravellerShuttleModel(
  tripId: json['tripId'] as String,
  direction: json['direction'] as String? ?? 'pickup',
  mine: json['mine'] as bool? ?? false,
  startedAt: DateTime.parse(json['startedAt'] as String),
  vehicle: json['vehicle'] == null
      ? const TripVehicleModel()
      : TripVehicleModel.fromJson(json['vehicle'] as Map<String, dynamic>),
  driverFirstName: json['driverFirstName'] as String? ?? '',
  position: json['position'] == null
      ? null
      : ShuttlePositionModel.fromJson(json['position'] as Map<String, dynamic>),
  positionAgeSeconds: (json['positionAgeSeconds'] as num?)?.toInt(),
  distanceM: (json['distanceM'] as num?)?.toInt(),
  etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
  etaAt: json['etaAt'] == null ? null : DateTime.parse(json['etaAt'] as String),
  meetingPoint: json['meetingPoint'] == null
      ? null
      : MeetingPointModel.fromJson(
          json['meetingPoint'] as Map<String, dynamic>,
        ),
  destination: json['destination'] == null
      ? null
      : ShuttleDestinationModel.fromJson(
          json['destination'] as Map<String, dynamic>,
        ),
);

Map<String, dynamic> _$TravellerShuttleModelToJson(
  _TravellerShuttleModel instance,
) => <String, dynamic>{
  'tripId': instance.tripId,
  'direction': instance.direction,
  'mine': instance.mine,
  'startedAt': instance.startedAt.toIso8601String(),
  'vehicle': instance.vehicle,
  'driverFirstName': instance.driverFirstName,
  'position': instance.position,
  'positionAgeSeconds': instance.positionAgeSeconds,
  'distanceM': instance.distanceM,
  'etaMinutes': instance.etaMinutes,
  'etaAt': instance.etaAt?.toIso8601String(),
  'meetingPoint': instance.meetingPoint,
  'destination': instance.destination,
};

_ShuttleDestinationModel _$ShuttleDestinationModelFromJson(
  Map<String, dynamic> json,
) => _ShuttleDestinationModel(
  kind: json['kind'] as String,
  lat: (json['lat'] as num).toDouble(),
  lng: (json['lng'] as num).toDouble(),
  label: json['label'] as String?,
);

Map<String, dynamic> _$ShuttleDestinationModelToJson(
  _ShuttleDestinationModel instance,
) => <String, dynamic>{
  'kind': instance.kind,
  'lat': instance.lat,
  'lng': instance.lng,
  'label': instance.label,
};

_StayShuttlesModel _$StayShuttlesModelFromJson(Map<String, dynamic> json) =>
    _StayShuttlesModel(
      phase: json['phase'] as String?,
      serverTime: DateTime.parse(json['serverTime'] as String),
      shuttles:
          (json['shuttles'] as List<dynamic>?)
              ?.map(
                (e) =>
                    TravellerShuttleModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
    );

Map<String, dynamic> _$StayShuttlesModelToJson(_StayShuttlesModel instance) =>
    <String, dynamic>{
      'phase': instance.phase,
      'serverTime': instance.serverTime.toIso8601String(),
      'shuttles': instance.shuttles,
    };

_ReturnParkingModel _$ReturnParkingModelFromJson(Map<String, dynamic> json) =>
    _ReturnParkingModel(
      name: json['name'] as String,
      phone: json['phone'] as String?,
      shuttleMinutes: (json['shuttleMinutes'] as num?)?.toInt(),
      address: json['address'] as String?,
      location: json['location'] == null
          ? null
          : ShuttlePositionModel.fromJson(
              json['location'] as Map<String, dynamic>,
            ),
    );

Map<String, dynamic> _$ReturnParkingModelToJson(_ReturnParkingModel instance) =>
    <String, dynamic>{
      'name': instance.name,
      'phone': instance.phone,
      'shuttleMinutes': instance.shuttleMinutes,
      'address': instance.address,
      'location': instance.location,
    };

_TravellerReturnModel _$TravellerReturnModelFromJson(
  Map<String, dynamic> json,
) => _TravellerReturnModel(
  reference: json['reference'] as String,
  status: json['status'] as String,
  returnAt: json['returnAt'] as String,
  returnDay: json['returnDay'] as bool? ?? false,
  flight: json['flight'] == null
      ? const FlightViewModel()
      : FlightViewModel.fromJson(json['flight'] as Map<String, dynamic>),
  flightTracked: json['flightTracked'] as bool? ?? false,
  meetingPoint: json['meetingPoint'] == null
      ? null
      : MeetingPointModel.fromJson(
          json['meetingPoint'] as Map<String, dynamic>,
        ),
  atMeetingPointAt: json['atMeetingPointAt'] == null
      ? null
      : DateTime.parse(json['atMeetingPointAt'] as String),
  shuttle: json['shuttle'] == null
      ? null
      : TravellerShuttleModel.fromJson(json['shuttle'] as Map<String, dynamic>),
  parking: ReturnParkingModel.fromJson(json['parking'] as Map<String, dynamic>),
  plate: json['plate'] as String,
  spot: json['spot'] == null
      ? null
      : ReturnSpotModel.fromJson(json['spot'] as Map<String, dynamic>),
  car: json['car'] == null
      ? null
      : CarLocationModel.fromJson(json['car'] as Map<String, dynamic>),
);

Map<String, dynamic> _$TravellerReturnModelToJson(
  _TravellerReturnModel instance,
) => <String, dynamic>{
  'reference': instance.reference,
  'status': instance.status,
  'returnAt': instance.returnAt,
  'returnDay': instance.returnDay,
  'flight': instance.flight,
  'flightTracked': instance.flightTracked,
  'meetingPoint': instance.meetingPoint,
  'atMeetingPointAt': instance.atMeetingPointAt?.toIso8601String(),
  'shuttle': instance.shuttle,
  'parking': instance.parking,
  'plate': instance.plate,
  'spot': instance.spot,
  'car': instance.car,
};

_ReturnSpotModel _$ReturnSpotModelFromJson(Map<String, dynamic> json) =>
    _ReturnSpotModel(
      code: json['code'] as String,
      stayClass: json['stayClass'] as String?,
    );

Map<String, dynamic> _$ReturnSpotModelToJson(_ReturnSpotModel instance) =>
    <String, dynamic>{'code': instance.code, 'stayClass': instance.stayClass};

_ShuttleStatusModel _$ShuttleStatusModelFromJson(Map<String, dynamic> json) =>
    _ShuttleStatusModel(
      shuttle: json['shuttle'] == null
          ? null
          : TravellerShuttleModel.fromJson(
              json['shuttle'] as Map<String, dynamic>,
            ),
      serverTime: DateTime.parse(json['serverTime'] as String),
    );

Map<String, dynamic> _$ShuttleStatusModelToJson(_ShuttleStatusModel instance) =>
    <String, dynamic>{
      'shuttle': instance.shuttle,
      'serverTime': instance.serverTime.toIso8601String(),
    };

_RoutePointModel _$RoutePointModelFromJson(Map<String, dynamic> json) =>
    _RoutePointModel(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );

Map<String, dynamic> _$RoutePointModelToJson(_RoutePointModel instance) =>
    <String, dynamic>{'lat': instance.lat, 'lng': instance.lng};

_WalkingRouteModel _$WalkingRouteModelFromJson(Map<String, dynamic> json) =>
    _WalkingRouteModel(
      geometry:
          (json['geometry'] as List<dynamic>?)
              ?.map(
                (e) => (e as List<dynamic>)
                    .map((e) => (e as num).toDouble())
                    .toList(),
              )
              .toList() ??
          const [],
      distanceM: (json['distanceM'] as num?)?.toInt() ?? 0,
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 1,
      fallback: json['fallback'] as bool? ?? false,
      from: RoutePointModel.fromJson(json['from'] as Map<String, dynamic>),
      to: RoutePointModel.fromJson(json['to'] as Map<String, dynamic>),
      meetingPoint: json['meetingPoint'] == null
          ? null
          : MeetingPointModel.fromJson(
              json['meetingPoint'] as Map<String, dynamic>,
            ),
    );

Map<String, dynamic> _$WalkingRouteModelToJson(_WalkingRouteModel instance) =>
    <String, dynamic>{
      'geometry': instance.geometry,
      'distanceM': instance.distanceM,
      'durationMinutes': instance.durationMinutes,
      'fallback': instance.fallback,
      'from': instance.from,
      'to': instance.to,
      'meetingPoint': instance.meetingPoint,
    };

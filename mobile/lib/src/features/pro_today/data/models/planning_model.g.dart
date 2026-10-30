// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'planning_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PlanningRowModel _$PlanningRowModelFromJson(Map<String, dynamic> json) =>
    _PlanningRowModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      status: json['status'] as String,
      arrivalAt: DateTime.parse(json['arrivalAt'] as String),
      returnAt: DateTime.parse(json['returnAt'] as String),
      arrivedAt: json['arrivedAt'] == null
          ? null
          : DateTime.parse(json['arrivedAt'] as String),
      passengers: (json['passengers'] as num).toInt(),
      customerName: json['customerName'] as String,
      plate: json['plate'] as String,
      returnFlight: json['returnFlight'] as String?,
      departureFlight: json['departureFlight'] as String?,
      departureScheduledAt: json['departureScheduledAt'] == null
          ? null
          : DateTime.parse(json['departureScheduledAt'] as String),
      departureEstimatedAt: json['departureEstimatedAt'] == null
          ? null
          : DateTime.parse(json['departureEstimatedAt'] as String),
      flightScheduledAt: json['flightScheduledAt'] == null
          ? null
          : DateTime.parse(json['flightScheduledAt'] as String),
      flightEstimatedAt: json['flightEstimatedAt'] == null
          ? null
          : DateTime.parse(json['flightEstimatedAt'] as String),
      flightLandedAt: json['flightLandedAt'] == null
          ? null
          : DateTime.parse(json['flightLandedAt'] as String),
      stopName: json['stopName'] as String?,
      departureCity: json['departureCity'] as String?,
      returnCity: json['returnCity'] as String?,
      stopId: json['stopId'] as String?,
      arrivalSignal: json['arrivalSignal'] == null
          ? null
          : StaffSignalModel.fromJson(
              json['arrivalSignal'] as Map<String, dynamic>,
            ),
      handover: json['handover'] as String? ?? 'shuttle',
    );

Map<String, dynamic> _$PlanningRowModelToJson(_PlanningRowModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'reference': instance.reference,
      'status': instance.status,
      'arrivalAt': instance.arrivalAt.toIso8601String(),
      'returnAt': instance.returnAt.toIso8601String(),
      'arrivedAt': instance.arrivedAt?.toIso8601String(),
      'passengers': instance.passengers,
      'customerName': instance.customerName,
      'plate': instance.plate,
      'returnFlight': instance.returnFlight,
      'departureFlight': instance.departureFlight,
      'departureScheduledAt': instance.departureScheduledAt?.toIso8601String(),
      'departureEstimatedAt': instance.departureEstimatedAt?.toIso8601String(),
      'flightScheduledAt': instance.flightScheduledAt?.toIso8601String(),
      'flightEstimatedAt': instance.flightEstimatedAt?.toIso8601String(),
      'flightLandedAt': instance.flightLandedAt?.toIso8601String(),
      'stopName': instance.stopName,
      'departureCity': instance.departureCity,
      'returnCity': instance.returnCity,
      'stopId': instance.stopId,
      'arrivalSignal': instance.arrivalSignal,
      'handover': instance.handover,
    };

_PlanningParkingModel _$PlanningParkingModelFromJson(
  Map<String, dynamic> json,
) => _PlanningParkingModel(
  id: json['id'] as String,
  name: json['name'] as String,
);

Map<String, dynamic> _$PlanningParkingModelToJson(
  _PlanningParkingModel instance,
) => <String, dynamic>{'id': instance.id, 'name': instance.name};

_PlanningModel _$PlanningModelFromJson(Map<String, dynamic> json) =>
    _PlanningModel(
      date: json['date'] as String,
      parking: PlanningParkingModel.fromJson(
        json['parking'] as Map<String, dynamic>,
      ),
      arrivals:
          (json['arrivals'] as List<dynamic>?)
              ?.map((e) => PlanningRowModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      returns:
          (json['returns'] as List<dynamic>?)
              ?.map((e) => PlanningRowModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$PlanningModelToJson(_PlanningModel instance) =>
    <String, dynamic>{
      'date': instance.date,
      'parking': instance.parking,
      'arrivals': instance.arrivals,
      'returns': instance.returns,
    };

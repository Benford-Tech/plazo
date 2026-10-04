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
      passengers: (json['passengers'] as num).toInt(),
      customerName: json['customerName'] as String,
      plate: json['plate'] as String,
      returnFlight: json['returnFlight'] as String?,
      arrivalSignal: json['arrivalSignal'] == null
          ? null
          : StaffSignalModel.fromJson(
              json['arrivalSignal'] as Map<String, dynamic>,
            ),
    );

Map<String, dynamic> _$PlanningRowModelToJson(_PlanningRowModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'reference': instance.reference,
      'status': instance.status,
      'arrivalAt': instance.arrivalAt.toIso8601String(),
      'returnAt': instance.returnAt.toIso8601String(),
      'passengers': instance.passengers,
      'customerName': instance.customerName,
      'plate': instance.plate,
      'returnFlight': instance.returnFlight,
      'arrivalSignal': instance.arrivalSignal,
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

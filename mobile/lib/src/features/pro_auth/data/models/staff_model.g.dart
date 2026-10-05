// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'staff_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_StaffModel _$StaffModelFromJson(Map<String, dynamic> json) => _StaffModel(
  id: json['id'] as String,
  name: json['name'] as String,
  email: json['email'] as String,
  role: json['role'] as String,
  operatorName: json['operatorName'] as String?,
  post: json['post'] as String?,
  postSetAt: json['postSetAt'] == null
      ? null
      : DateTime.parse(json['postSetAt'] as String),
  effectivePost: json['effectivePost'] as String?,
  allowedPosts:
      (json['allowedPosts'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  vehicle: json['vehicle'] == null
      ? null
      : TodayVehicleModel.fromJson(json['vehicle'] as Map<String, dynamic>),
);

Map<String, dynamic> _$StaffModelToJson(_StaffModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'role': instance.role,
      'operatorName': instance.operatorName,
      'post': instance.post,
      'postSetAt': instance.postSetAt?.toIso8601String(),
      'effectivePost': instance.effectivePost,
      'allowedPosts': instance.allowedPosts,
      'vehicle': instance.vehicle,
    };

_TodayVehicleModel _$TodayVehicleModelFromJson(Map<String, dynamic> json) =>
    _TodayVehicleModel(
      id: json['id'] as String,
      model: json['model'] as String,
      colour: json['colour'] as String?,
      plate: json['plate'] as String?,
      seats: (json['seats'] as num?)?.toInt(),
    );

Map<String, dynamic> _$TodayVehicleModelToJson(_TodayVehicleModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'model': instance.model,
      'colour': instance.colour,
      'plate': instance.plate,
      'seats': instance.seats,
    };

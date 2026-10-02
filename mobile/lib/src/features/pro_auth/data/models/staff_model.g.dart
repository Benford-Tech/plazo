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
);

Map<String, dynamic> _$StaffModelToJson(_StaffModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'role': instance.role,
      'operatorName': instance.operatorName,
    };

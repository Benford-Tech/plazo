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
    };

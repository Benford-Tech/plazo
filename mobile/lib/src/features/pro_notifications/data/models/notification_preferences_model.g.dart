// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_preferences_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_NotificationPreferencesModel _$NotificationPreferencesModelFromJson(
  Map<String, dynamic> json,
) => _NotificationPreferencesModel(
  arrivals: json['arrivals'] as bool,
  returns: json['returns'] as bool,
  devices: (json['devices'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$NotificationPreferencesModelToJson(
  _NotificationPreferencesModel instance,
) => <String, dynamic>{
  'arrivals': instance.arrivals,
  'returns': instance.returns,
  'devices': instance.devices,
};

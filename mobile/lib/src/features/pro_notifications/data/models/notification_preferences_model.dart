import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_preferences_model.freezed.dart';
part 'notification_preferences_model.g.dart';

/// What the signed-in person is notified of: drop-offs (arrivals), returns, or both.
@freezed
abstract class NotificationPreferencesModel with _$NotificationPreferencesModel {
  const factory NotificationPreferencesModel({required bool arrivals, required bool returns, @Default(true) bool shuttles, @Default(true) bool platform, @Default(true) bool bookings, @Default(0) int devices}) =
      _NotificationPreferencesModel;

  factory NotificationPreferencesModel.fromJson(Map<String, dynamic> json) => _$NotificationPreferencesModelFromJson(json);
}

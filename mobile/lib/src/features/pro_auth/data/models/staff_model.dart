import 'package:freezed_annotation/freezed_annotation.dart';

part 'staff_model.freezed.dart';
part 'staff_model.g.dart';

/// The signed-in staff member (GET /internal/staff/me, login's `user`).
@freezed
abstract class StaffModel with _$StaffModel {
  const StaffModel._();

  const factory StaffModel({
    required String id,
    required String name,
    required String email,

    /// manager, agent, driver, valet
    required String role,
    String? operatorName,

    /// The post held today (R-C, 04/10/2026), null until chosen; among [allowedPosts].
    String? post,
    DateTime? postSetAt,
    String? effectivePost,
    @Default([]) List<String> allowedPosts,

    /// The shuttle taken for the day (V-A, 05/10/2026), null when none.
    TodayVehicleModel? vehicle,
  }) = _StaffModel;

  /// The post the app lays itself out for: the one chosen, else the role.
  String get activePost => effectivePost ?? post ?? role;

  factory StaffModel.fromJson(Map<String, dynamic> json) => _$StaffModelFromJson(json);
}

/// "Mon véhicule aujourd'hui": the shuttle a driver took for the day.
@freezed
abstract class TodayVehicleModel with _$TodayVehicleModel {
  const TodayVehicleModel._();

  const factory TodayVehicleModel({required String id, required String model, String? colour, String? plate, int? seats}) = _TodayVehicleModel;

  factory TodayVehicleModel.fromJson(Map<String, dynamic> json) => _$TodayVehicleModelFromJson(json);

  /// "Mercedes Vito · blanche".
  String get title => [model, colour].whereType<String>().join(' · ');
}

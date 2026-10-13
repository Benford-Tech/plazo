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

    /// First and last name (06/10/2026); `name` is the display form.
    @Default('') String firstName,
    @Default('') String lastName,
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

    /// How the member signs in (13/10/2026): a password of their own (false for an account made with Apple or
    /// Google, or invited and never set; true for an older server), and the Apple / Google identities linked.
    @Default(true) bool hasPassword,
    @Default([]) List<StaffIdentityModel> identities,
  }) = _StaffModel;

  /// The post the app lays itself out for: the one chosen, else the role.
  String get activePost => effectivePost ?? post ?? role;

  /// The identity of this provider (apple, google) linked to the account, if any.
  StaffIdentityModel? identity(String provider) => identities.where((i) => i.provider == provider).firstOrNull;

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

/// An Apple or Google identity linked to the member (« Connexion » of Mon compte).
@freezed
abstract class StaffIdentityModel with _$StaffIdentityModel {
  const factory StaffIdentityModel({required String provider, String? email}) = _StaffIdentityModel;

  factory StaffIdentityModel.fromJson(Map<String, dynamic> json) => _$StaffIdentityModelFromJson(json);
}

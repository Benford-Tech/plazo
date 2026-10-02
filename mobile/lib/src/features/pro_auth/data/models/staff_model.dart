import 'package:freezed_annotation/freezed_annotation.dart';

part 'staff_model.freezed.dart';
part 'staff_model.g.dart';

/// The signed-in staff member (GET /internal/staff/me, login's `user`).
@freezed
abstract class StaffModel with _$StaffModel {
  const factory StaffModel({
    required String id,
    required String name,
    required String email,
    /// manager, agent, driver, valet
    required String role,
    String? operatorName,
  }) = _StaffModel;

  factory StaffModel.fromJson(Map<String, dynamic> json) => _$StaffModelFromJson(json);
}

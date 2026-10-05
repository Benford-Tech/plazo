part of 'pro_auth_bloc.dart';

enum ProAuthStatus { unknown, signedIn, signedOut }

@freezed
abstract class ProAuthState with _$ProAuthState {
  const factory ProAuthState({
    @Default(ProAuthStatus.unknown) ProAuthStatus status,
    @Default(ViewState.idle) ViewState viewState,
    StaffModel? staff,

    /// Saving the post of the day.
    @Default(ViewState.idle) ViewState postState,

    /// Saving the vehicle of the day (V-A).
    @Default(ViewState.idle) ViewState vehicleState,
    String? errorCode,
    String? errorMessage,
  }) = _ProAuthState;
}

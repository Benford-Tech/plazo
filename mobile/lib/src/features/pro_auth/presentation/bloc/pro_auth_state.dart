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

    /// Saving one's own first and last name (« Votre nom », 09/10/2026), and the API's codes per field.
    @Default(ViewState.idle) ViewState nameState,
    @Default(<String, String>{}) Map<String, String> nameErrors,
    String? errorCode,
    String? errorMessage,
  }) = _ProAuthState;
}

part of 'pro_auth_bloc.dart';

/// `onboarding` (13/10/2026): signed in with Apple or Google, not a member of a parking yet (« Rejoindre un parking »).
enum ProAuthStatus { unknown, signedIn, signedOut, onboarding }

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

    /// The Apple / Google identity and its latest join request, while [status] is onboarding.
    OnboardingModel? onboarding,

    /// The sign-ins this phone offers (its build and the API's keys): « Continuer avec Apple / Google », the links
    /// of Mon compte, the confirmations of « Supprimer mon compte ».
    @Default(ProvidersModel()) ProvidersModel providers,

    /// « Continuer avec … » running, and with which provider (apple, google).
    @Default(ViewState.idle) ViewState signInState,
    String? signingInWith,

    /// Mon compte (13/10/2026): linking / unlinking Apple or Google, « Quitter ce parking », « Supprimer mon compte »
    /// (also from the waiting screen of « Rejoindre un parking »).
    @Default(ViewState.idle) ViewState linkState,
    @Default(ViewState.idle) ViewState leaveState,
    @Default(ViewState.idle) ViewState deleteState,

    /// What Mon compte last did: "account.linked", "account.unlinked".
    String? accountNotice,
  }) = _ProAuthState;
}

part of 'pro_auth_bloc.dart';

sealed class ProAuthEvent {
  const ProAuthEvent();
}

class ProAuthRestoreRequested extends ProAuthEvent {
  const ProAuthRestoreRequested();
}

class ProAuthLoginSubmitted extends ProAuthEvent {
  const ProAuthLoginSubmitted({required this.email, required this.password});
  final String email;
  final String password;
}

/// "Aujourd'hui, je suis…": the post held for the day.
class ProAuthPostChosen extends ProAuthEvent {
  const ProAuthPostChosen(this.post);
  final String post;
}

/// "Mon véhicule aujourd'hui" (V-A): the shuttle taken for the day (null: none).
class ProAuthVehicleChosen extends ProAuthEvent {
  const ProAuthVehicleChosen(this.vehicleId);
  final String? vehicleId;
}

/// « Votre nom » (09/10/2026): one's own first and last name.
class ProAuthNameSubmitted extends ProAuthEvent {
  const ProAuthNameSubmitted({required this.firstName, required this.lastName});
  final String firstName;
  final String lastName;
}

/// The « Nom enregistré. » toast was shown.
class ProAuthNameNoticeShown extends ProAuthEvent {
  const ProAuthNameNoticeShown();
}

class ProAuthLogoutRequested extends ProAuthEvent {
  const ProAuthLogoutRequested();
}

class ProAuthSessionExpired extends ProAuthEvent {
  const ProAuthSessionExpired();
}

/// The sign-ins this phone offers (Apple on iPhone, Google on Android, and the API's keys).
class ProAuthProvidersRequested extends ProAuthEvent {
  const ProAuthProvidersRequested();
}

/// « Continuer avec Apple » / « Continuer avec Google » (13/10/2026): `apple` or `google`.
class ProAuthProviderSignInRequested extends ProAuthEvent {
  const ProAuthProviderSignInRequested(this.provider);
  final String provider;
}

/// « Rejoindre un parking »: a manager accepted the request and the staff session is open.
class ProAuthJoined extends ProAuthEvent {
  const ProAuthJoined(this.staff);
  final StaffModel staff;
}

/// The API refused the onboarding token (expired, revoked): back to the login.
class ProAuthOnboardingExpired extends ProAuthEvent {
  const ProAuthOnboardingExpired();
}

/// Mon compte › Connexion: link Apple or Google to the account.
class ProAuthIdentityLinkRequested extends ProAuthEvent {
  const ProAuthIdentityLinkRequested(this.provider);
  final String provider;
}

/// Mon compte › Connexion › « Retirer ».
class ProAuthIdentityUnlinkRequested extends ProAuthEvent {
  const ProAuthIdentityUnlinkRequested(this.provider);
  final String provider;
}

/// « Quitter ce parking ».
class ProAuthLeaveRequested extends ProAuthEvent {
  const ProAuthLeaveRequested();
}

/// « Supprimer mon compte »: a member confirms with their password, or with Apple / Google (`provider`); before
/// joining a parking, the identity alone is deleted (Apple confirms, to revoke its access).
class ProAuthDeleteRequested extends ProAuthEvent {
  const ProAuthDeleteRequested({this.password, this.provider});
  final String? password;
  final String? provider;
}

/// The result of a Mon compte action was shown.
class ProAuthAccountNoticeShown extends ProAuthEvent {
  const ProAuthAccountNoticeShown();
}

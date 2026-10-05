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

class ProAuthLogoutRequested extends ProAuthEvent {
  const ProAuthLogoutRequested();
}

class ProAuthSessionExpired extends ProAuthEvent {
  const ProAuthSessionExpired();
}

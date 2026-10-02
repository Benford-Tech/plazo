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

class ProAuthLogoutRequested extends ProAuthEvent {
  const ProAuthLogoutRequested();
}

class ProAuthSessionExpired extends ProAuthEvent {
  const ProAuthSessionExpired();
}

import 'package:auto_route/auto_route.dart';

import '../../features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'app_router.dart';

/// Waits for the restore at start-up (staff session, then the onboarding one).
Future<ProAuthState> _settled(ProAuthBloc auth) async {
  final state = auth.state;
  if (state.status != ProAuthStatus.unknown) return state;
  return auth.stream.firstWhere((s) => s.status != ProAuthStatus.unknown);
}

/// The staff's screens need a session: waits for the restore at start-up, else sends to the login, or (13/10/2026)
/// to « Rejoindre un parking » for someone signed in with Apple or Google who has no parking yet.
class ProAuthGuard extends AutoRouteGuard {
  ProAuthGuard(this._auth);

  final ProAuthBloc _auth;
  ProAuthBloc get auth => _auth;

  @override
  Future<void> onNavigation(NavigationResolver resolver, StackRouter router) async {
    final state = await _settled(_auth);
    if (state.status == ProAuthStatus.signedIn) {
      resolver.next();
    } else if (state.status == ProAuthStatus.onboarding) {
      resolver.next(false);
      await router.push(const ProJoinRoute());
    } else {
      resolver.next(false);
      await router.push(const ProLoginRoute());
    }
  }
}

/// « Rejoindre un parking » needs the onboarding session: a member goes to their tabs, anyone else to the login.
class ProJoinGuard extends AutoRouteGuard {
  ProJoinGuard(this._auth);

  final ProAuthBloc _auth;

  @override
  Future<void> onNavigation(NavigationResolver resolver, StackRouter router) async {
    final state = await _settled(_auth);
    if (state.status == ProAuthStatus.onboarding) {
      resolver.next();
    } else if (state.status == ProAuthStatus.signedIn) {
      resolver.next(false);
      await router.replaceAll([const ProShellRoute()]);
    } else {
      resolver.next(false);
      await router.push(const ProLoginRoute());
    }
  }
}

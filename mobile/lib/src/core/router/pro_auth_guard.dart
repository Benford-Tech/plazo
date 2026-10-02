import 'package:auto_route/auto_route.dart';

import '../../features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'app_router.dart';

/// The staff's screens need a session: waits for the restore at start-up, else sends to the login.
class ProAuthGuard extends AutoRouteGuard {
  ProAuthGuard(this._auth);

  final ProAuthBloc _auth;

  @override
  Future<void> onNavigation(NavigationResolver resolver, StackRouter router) async {
    var state = _auth.state;
    if (state.status == ProAuthStatus.unknown) {
      state = await _auth.stream.firstWhere((s) => s.status != ProAuthStatus.unknown);
    }
    if (state.status == ProAuthStatus.signedIn) {
      resolver.next();
    } else {
      resolver.next(false);
      await router.push(const ProLoginRoute());
    }
  }
}

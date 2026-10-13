import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/networking/networking.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../core/error/failure.dart';
import '../../data/models/onboarding_models.dart';
import '../../data/models/staff_model.dart';
import '../../domain/usecases/identity_use_cases.dart';
import '../../domain/usecases/login_use_case.dart';
import '../../domain/usecases/logout_use_case.dart';
import '../../domain/usecases/restore_session_use_case.dart';
import '../../domain/usecases/set_post_use_case.dart';
import '../../domain/usecases/set_vehicle_use_case.dart';
import '../../domain/usecases/update_name_use_case.dart';

part 'pro_auth_bloc.freezed.dart';
part 'pro_auth_event.dart';
part 'pro_auth_state.dart';

/// The staff's session in the pro flow: login with the existing /internal/auth routes, restore at
/// start-up, logout; a refused refresh (SessionEvents) signs out. Since 13/10/2026 also Apple (iPhone) and Google
/// (Android): a member signs in, anyone else gets an onboarding session (« Rejoindre un parking ») restored after the
/// staff's at start-up; and Mon compte's links, « Quitter ce parking » and « Supprimer mon compte ».
class ProAuthBloc extends Bloc<ProAuthEvent, ProAuthState> {
  ProAuthBloc(this._login, this._restore, this._logout, this._setPost, this._setVehicle, this._updateName, SessionEvents session, {IdentityUseCases? identity})
    : _identity = identity,
      super(ProAuthState(deviceProviders: identity?.device ?? const ProvidersModel())) {
    on<ProAuthRestoreRequested>(_onRestore);
    on<ProAuthProvidersRequested>(_onProviders);
    on<ProAuthProviderSignInRequested>(_onProviderSignIn);
    on<ProAuthJoined>((event, emit) => emit(_fresh(ProAuthStatus.signedIn, staff: event.staff)));
    // Each session ends on its own: a late 401 of the staff's (a poll after « Quitter ce parking ») never ends the
    // onboarding session, and the reverse.
    on<ProAuthOnboardingExpired>((event, emit) {
      if (state.status == ProAuthStatus.onboarding) emit(_fresh(ProAuthStatus.signedOut, errorCode: 'session_expired'));
    });
    on<ProAuthIdentityLinkRequested>(_onLink);
    on<ProAuthIdentityUnlinkRequested>(_onUnlink);
    on<ProAuthLeaveRequested>(_onLeave);
    on<ProAuthDeleteRequested>(_onDelete);
    on<ProAuthAccountNoticeShown>(
      (event, emit) =>
          emit(state.copyWith(linkState: ViewState.idle, leaveState: ViewState.idle, deleteState: ViewState.idle, accountNotice: null, errorCode: null)),
    );
    on<ProAuthLoginSubmitted>(_onLogin);
    on<ProAuthLogoutRequested>(_onLogout);
    on<ProAuthPostChosen>(_onPostChosen);
    on<ProAuthVehicleChosen>(_onVehicleChosen);
    on<ProAuthNameSubmitted>(_onNameSubmitted);
    on<ProAuthNameNoticeShown>((event, emit) => emit(state.copyWith(nameState: ViewState.idle)));
    on<ProAuthSessionExpired>((event, emit) {
      if (state.status == ProAuthStatus.signedIn) emit(_fresh(ProAuthStatus.signedOut, errorCode: 'session_expired'));
    });
    _expired = session.expired.listen((_) => add(const ProAuthSessionExpired()));
    _onboardingExpired = session.onboardingExpired.listen((_) => add(const ProAuthOnboardingExpired()));
  }

  final LoginUseCase _login;
  final RestoreSessionUseCase _restore;
  final LogoutUseCase _logout;
  final SetPostUseCase _setPost;
  final SetVehicleUseCase _setVehicle;
  final UpdateNameUseCase _updateName;
  final IdentityUseCases? _identity;
  late final StreamSubscription<void> _expired;
  late final StreamSubscription<void> _onboardingExpired;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  /// A new session state (signed in, signed out, onboarding) that keeps what the phone and the API offer.
  ProAuthState _fresh(
    ProAuthStatus status, {
    StaffModel? staff,
    OnboardingModel? onboarding,
    String? errorCode,
    ViewState leaveState = ViewState.idle,
    ViewState deleteState = ViewState.idle,
  }) => ProAuthState(
    status: status,
    staff: staff,
    onboarding: onboarding,
    errorCode: errorCode,
    leaveState: leaveState,
    deleteState: deleteState,
    providers: state.providers,
    deviceProviders: state.deviceProviders,
  );

  /// The staff's session first, then (13/10/2026) the onboarding one of « Rejoindre un parking ».
  Future<void> _onRestore(ProAuthRestoreRequested event, Emitter<ProAuthState> emit) async {
    final result = await _restore(NoParams());
    final staff = result.fold((_) => null, (staff) => staff);
    if (staff != null) {
      emit(state.copyWith(status: ProAuthStatus.signedIn, staff: staff));
      // No login page on the way: Mon compte's links read the sign-ins offered here.
      return add(const ProAuthProvidersRequested());
    }
    final onboarding = (await _identity?.restoreOnboarding(NoParams()))?.fold((_) => null, (o) => o);
    if (onboarding != null) {
      emit(state.copyWith(status: ProAuthStatus.onboarding, onboarding: onboarding, staff: null));
      return add(const ProAuthProvidersRequested());
    }
    emit(state.copyWith(status: ProAuthStatus.signedOut, staff: null));
  }

  Future<void> _onProviders(ProAuthProvidersRequested event, Emitter<ProAuthState> emit) async {
    final result = await _identity?.providers(NoParams());
    // Unreachable API: the buttons stay hidden, the email form works as before.
    result?.fold((_) {}, (providers) => emit(state.copyWith(providers: providers)));
  }

  Future<void> _onProviderSignIn(ProAuthProviderSignInRequested event, Emitter<ProAuthState> emit) async {
    final identity = _identity;
    if (identity == null) return;
    emit(state.copyWith(signInState: ViewState.processing, signingInWith: event.provider, errorCode: null, errorMessage: null));
    final result = await identity.signIn(event.provider);
    result.fold(
      (f) => emit(
        f.code == signInCancelled
            ? state.copyWith(signInState: ViewState.idle, signingInWith: null)
            : state.copyWith(signInState: ViewState.error, signingInWith: null, errorCode: _code(f)),
      ),
      (outcome) => switch (outcome) {
        IdentitySignedIn(:final staff) => emit(
          state.copyWith(status: ProAuthStatus.signedIn, staff: staff, onboarding: null, signInState: ViewState.success, signingInWith: null),
        ),
        IdentityOnboarding(:final onboarding) => emit(
          state.copyWith(status: ProAuthStatus.onboarding, onboarding: onboarding, staff: null, signInState: ViewState.success, signingInWith: null),
        ),
      },
    );
  }

  Future<void> _onLink(ProAuthIdentityLinkRequested event, Emitter<ProAuthState> emit) async {
    final identity = _identity;
    if (identity == null) return;
    emit(state.copyWith(linkState: ViewState.processing, errorCode: null, accountNotice: null));
    final result = await identity.link(event.provider);
    result.fold(
      (f) => emit(f.code == signInCancelled ? state.copyWith(linkState: ViewState.idle) : state.copyWith(linkState: ViewState.error, errorCode: _code(f))),
      (staff) => emit(state.copyWith(linkState: ViewState.success, staff: staff, accountNotice: 'account.linked')),
    );
  }

  Future<void> _onUnlink(ProAuthIdentityUnlinkRequested event, Emitter<ProAuthState> emit) async {
    final identity = _identity;
    if (identity == null) return;
    emit(state.copyWith(linkState: ViewState.processing, errorCode: null, accountNotice: null));
    final result = await identity.unlink(event.provider);
    result.fold(
      (f) => emit(state.copyWith(linkState: ViewState.error, errorCode: _code(f))),
      (staff) => emit(state.copyWith(linkState: ViewState.success, staff: staff, accountNotice: 'account.unlinked')),
    );
  }

  /// « Quitter ce parking »: with Apple or Google linked, straight to « Rejoindre un parking »; else signed out.
  Future<void> _onLeave(ProAuthLeaveRequested event, Emitter<ProAuthState> emit) async {
    final identity = _identity;
    if (identity == null) return;
    emit(state.copyWith(leaveState: ViewState.processing, errorCode: null));
    final result = await identity.leave(NoParams());
    result.fold(
      (f) => emit(state.copyWith(leaveState: ViewState.error, errorCode: _code(f))),
      (onboarding) =>
          emit(_fresh(onboarding == null ? ProAuthStatus.signedOut : ProAuthStatus.onboarding, onboarding: onboarding, leaveState: ViewState.success)),
    );
  }

  /// « Supprimer mon compte »: a member's account, or (onboarding) the identity that never joined.
  Future<void> _onDelete(ProAuthDeleteRequested event, Emitter<ProAuthState> emit) async {
    final identity = _identity;
    if (identity == null) return;
    emit(state.copyWith(deleteState: ViewState.processing, errorCode: null));
    final result = state.status == ProAuthStatus.onboarding
        ? await identity.deleteIdentity(state.onboarding?.identity.provider ?? event.provider ?? '')
        : await identity.deleteAccount(DeleteAccountParams(password: event.password, provider: event.provider));
    result.fold(
      (f) => emit(f.code == signInCancelled ? state.copyWith(deleteState: ViewState.idle) : state.copyWith(deleteState: ViewState.error, errorCode: _code(f))),
      (_) => emit(_fresh(ProAuthStatus.signedOut, deleteState: ViewState.success)),
    );
  }

  Future<void> _onLogin(ProAuthLoginSubmitted event, Emitter<ProAuthState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null, errorMessage: null));
    final result = await _login(LoginParams(email: event.email, password: event.password));
    result.fold(
      (failure) => emit(state.copyWith(viewState: ViewState.error, errorCode: failure.code, errorMessage: failure.message)),
      (staff) => emit(state.copyWith(viewState: ViewState.success, status: ProAuthStatus.signedIn, staff: staff)),
    );
  }

  Future<void> _onPostChosen(ProAuthPostChosen event, Emitter<ProAuthState> emit) async {
    emit(state.copyWith(postState: ViewState.processing, errorCode: null));
    final result = await _setPost(event.post);
    result.fold(
      (failure) => emit(state.copyWith(postState: ViewState.error, errorCode: failure.code ?? 'generic')),
      (staff) => emit(state.copyWith(postState: ViewState.success, staff: staff)),
    );
  }

  Future<void> _onVehicleChosen(ProAuthVehicleChosen event, Emitter<ProAuthState> emit) async {
    emit(state.copyWith(vehicleState: ViewState.processing, errorCode: null));
    final result = await _setVehicle(event.vehicleId);
    result.fold(
      (failure) => emit(state.copyWith(vehicleState: ViewState.error, errorCode: failure.code ?? 'generic')),
      (staff) => emit(state.copyWith(vehicleState: ViewState.success, staff: staff)),
    );
  }

  Future<void> _onNameSubmitted(ProAuthNameSubmitted event, Emitter<ProAuthState> emit) async {
    emit(state.copyWith(nameState: ViewState.processing, nameErrors: const {}, errorCode: null));
    final result = await _updateName(UpdateNameParams(firstName: event.firstName.trim(), lastName: event.lastName.trim()));
    result.fold(
      (failure) => emit(
        state.copyWith(
          nameState: ViewState.error,
          nameErrors: failure.fields ?? const {},
          errorCode: failure.fields?.isNotEmpty == true ? null : (failure.code ?? (failure.statusCode == null ? 'network' : 'generic')),
        ),
      ),
      (staff) => emit(state.copyWith(nameState: ViewState.success, staff: staff)),
    );
  }

  /// « Se déconnecter », and « Utiliser un autre compte » while joining a parking (ends the onboarding session).
  Future<void> _onLogout(ProAuthLogoutRequested event, Emitter<ProAuthState> emit) async {
    final identity = _identity;
    if (state.status == ProAuthStatus.onboarding && identity != null) {
      await identity.logoutOnboarding(NoParams());
    } else {
      await _logout(NoParams());
    }
    emit(_fresh(ProAuthStatus.signedOut));
  }

  @override
  Future<void> close() async {
    await _expired.cancel();
    await _onboardingExpired.cancel();
    return super.close();
  }
}

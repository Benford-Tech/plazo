import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/networking/networking.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/staff_model.dart';
import '../../domain/usecases/login_use_case.dart';
import '../../domain/usecases/logout_use_case.dart';
import '../../domain/usecases/restore_session_use_case.dart';
import '../../domain/usecases/set_post_use_case.dart';

part 'pro_auth_bloc.freezed.dart';
part 'pro_auth_event.dart';
part 'pro_auth_state.dart';

/// The staff's session in the pro flow: login with the existing /internal/auth routes, restore at
/// start-up, logout; a refused refresh (SessionEvents) signs out.
class ProAuthBloc extends Bloc<ProAuthEvent, ProAuthState> {
  ProAuthBloc(this._login, this._restore, this._logout, this._setPost, SessionEvents session) : super(const ProAuthState()) {
    on<ProAuthRestoreRequested>(_onRestore);
    on<ProAuthLoginSubmitted>(_onLogin);
    on<ProAuthLogoutRequested>(_onLogout);
    on<ProAuthPostChosen>(_onPostChosen);
    on<ProAuthSessionExpired>((event, emit) => emit(const ProAuthState(status: ProAuthStatus.signedOut, errorCode: 'session_expired')));
    _expired = session.expired.listen((_) => add(const ProAuthSessionExpired()));
  }

  final LoginUseCase _login;
  final RestoreSessionUseCase _restore;
  final LogoutUseCase _logout;
  final SetPostUseCase _setPost;
  late final StreamSubscription<void> _expired;

  Future<void> _onRestore(ProAuthRestoreRequested event, Emitter<ProAuthState> emit) async {
    final result = await _restore(NoParams());
    result.fold(
      (_) => emit(state.copyWith(status: ProAuthStatus.signedOut)),
      (staff) => emit(state.copyWith(status: staff == null ? ProAuthStatus.signedOut : ProAuthStatus.signedIn, staff: staff)),
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

  Future<void> _onLogout(ProAuthLogoutRequested event, Emitter<ProAuthState> emit) async {
    await _logout(NoParams());
    emit(const ProAuthState(status: ProAuthStatus.signedOut));
  }

  @override
  Future<void> close() async {
    await _expired.cancel();
    return super.close();
  }
}

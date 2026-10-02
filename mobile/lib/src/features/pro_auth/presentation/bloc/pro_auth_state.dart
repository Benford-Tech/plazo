part of 'pro_auth_bloc.dart';

enum ProAuthStatus { unknown, signedIn, signedOut }

@freezed
abstract class ProAuthState with _$ProAuthState {
  const factory ProAuthState({
    @Default(ProAuthStatus.unknown) ProAuthStatus status,
    @Default(ViewState.idle) ViewState viewState,
    StaffModel? staff,
    String? errorCode,
    String? errorMessage,
  }) = _ProAuthState;
}

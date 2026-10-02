part of 'pro_notifications_bloc.dart';

@freezed
abstract class ProNotificationsState with _$ProNotificationsState {
  const factory ProNotificationsState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState pushState,
    @Default(false) bool pushSupported,
    NotificationPreferencesModel? preferences,
    String? errorMessage,
  }) = _ProNotificationsState;
}

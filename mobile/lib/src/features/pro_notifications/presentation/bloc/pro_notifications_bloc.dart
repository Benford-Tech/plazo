import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/notification_preferences_model.dart';
import '../../domain/usecases/enable_push_use_case.dart';
import '../../domain/usecases/get_notification_preferences_use_case.dart';
import '../../domain/usecases/update_notification_preferences_use_case.dart';

part 'pro_notifications_bloc.freezed.dart';
part 'pro_notifications_event.dart';
part 'pro_notifications_state.dart';

class ProNotificationsBloc extends Bloc<ProNotificationsEvent, ProNotificationsState> {
  ProNotificationsBloc(this._get, this._update, this._enable) : super(ProNotificationsState(pushSupported: _enable.supported)) {
    on<ProNotificationsLoaded>(_onLoaded);
    on<ProNotificationsToggled>(_onToggled);
    on<ProNotificationsPushEnabled>(_onEnable);
  }

  final GetNotificationPreferencesUseCase _get;
  final UpdateNotificationPreferencesUseCase _update;
  final EnablePushUseCase _enable;

  Future<void> _onLoaded(ProNotificationsLoaded event, Emitter<ProNotificationsState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing));
    final result = await _get(NoParams());
    result.fold(
      (failure) => emit(state.copyWith(viewState: ViewState.error, errorMessage: failure.message)),
      (prefs) => emit(state.copyWith(viewState: ViewState.success, preferences: prefs)),
    );
  }

  Future<void> _onToggled(ProNotificationsToggled event, Emitter<ProNotificationsState> emit) async {
    final before = state.preferences;
    if (before == null) return;
    // Optimistic: the switch moves at once, and comes back if the API refuses.
    emit(
      state.copyWith(
        preferences: before.copyWith(
          arrivals: event.arrivals ?? before.arrivals,
          returns: event.returns ?? before.returns,
          shuttles: event.shuttles ?? before.shuttles,
          platform: event.platform ?? before.platform,
          bookings: event.bookings ?? before.bookings,
        ),
      ),
    );
    final result = await _update(PreferencesPatch(arrivals: event.arrivals, returns: event.returns, shuttles: event.shuttles, platform: event.platform, bookings: event.bookings));
    result.fold(
      (failure) => emit(state.copyWith(preferences: before, errorMessage: failure.message)),
      (prefs) => emit(state.copyWith(preferences: prefs, errorMessage: null)),
    );
  }

  Future<void> _onEnable(ProNotificationsPushEnabled event, Emitter<ProNotificationsState> emit) async {
    emit(state.copyWith(pushState: ViewState.processing, errorMessage: null));
    final result = await _enable(NoParams());
    await result.fold(
      (failure) async => emit(state.copyWith(pushState: ViewState.error, errorMessage: failure.message)),
      (_) async {
        emit(state.copyWith(pushState: ViewState.success));
        add(const ProNotificationsLoaded());
      },
    );
  }
}

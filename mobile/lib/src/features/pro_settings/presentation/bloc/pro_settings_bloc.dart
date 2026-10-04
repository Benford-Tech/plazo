import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/datasources/settings_data_source.dart';
import '../../data/models/settings_models.dart';
import '../../domain/usecases/settings_use_cases.dart';

part 'pro_settings_bloc.freezed.dart';

sealed class ProSettingsEvent {
  const ProSettingsEvent();
}

class ProSettingsStarted extends ProSettingsEvent {
  const ProSettingsStarted();
}

class ProSettingsParkingSaved extends ProSettingsEvent {
  const ProSettingsParkingSaved(this.input);
  final ParkingSettingsInput input;
}

class ProSettingsSmsSaved extends ProSettingsEvent {
  const ProSettingsSmsSaved(this.input, {this.testTo});
  final SmsSettingsInput input;

  /// After the save, a test SMS to this number (gateway mode).
  final String? testTo;
}

class ProSettingsSmsTested extends ProSettingsEvent {
  const ProSettingsSmsTested(this.to);
  final String to;
}

class ProSettingsSmsDisabled extends ProSettingsEvent {
  const ProSettingsSmsDisabled();
}

class ProSettingsPasswordChanged extends ProSettingsEvent {
  const ProSettingsPasswordChanged({required this.currentPassword, required this.newPassword});
  final String currentPassword;
  final String newPassword;
}

class ProSettingsNoticeShown extends ProSettingsEvent {
  const ProSettingsNoticeShown();
}

@freezed
abstract class ProSettingsState with _$ProSettingsState {
  const factory ProSettingsState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    ParkingSettingsModel? parking,
    SmsSettingsModel? sms,
    SmsStatusModel? smsStatus,

    /// "settings.saved", "sms.saved", "sms.test_sent:`to`", "sms.test_queued:`to`", "sms.disabled", "account.password_changed".
    String? notice,
    String? errorCode,
    @Default({}) Map<String, String> fieldErrors,
  }) = _ProSettingsState;
}

/// Parking settings and SMS channel (managers), and the signed-in member's password (everyone).
class ProSettingsBloc extends Bloc<ProSettingsEvent, ProSettingsState> {
  ProSettingsBloc(this._getParking, this._updateParking, this._getSms, this._getStatus, this._saveSms, this._testSms, this._disableSms, this._changePassword)
    : super(const ProSettingsState()) {
    on<ProSettingsStarted>(_onStarted);
    on<ProSettingsParkingSaved>(_onParkingSaved);
    on<ProSettingsSmsSaved>(_onSmsSaved);
    on<ProSettingsSmsTested>(_onSmsTested);
    on<ProSettingsSmsDisabled>(_onSmsDisabled);
    on<ProSettingsPasswordChanged>(_onPassword);
    on<ProSettingsNoticeShown>((e, emit) => emit(state.copyWith(notice: null, errorCode: null, actionState: ViewState.idle)));
  }

  final GetParkingSettingsUseCase _getParking;
  final UpdateParkingSettingsUseCase _updateParking;
  final GetSmsSettingsUseCase _getSms;
  final GetSmsStatusUseCase _getStatus;
  final SaveSmsSettingsUseCase _saveSms;
  final TestSmsUseCase _testSms;
  final DisableSmsUseCase _disableSms;
  final ChangePasswordUseCase _changePassword;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProSettingsStarted event, Emitter<ProSettingsState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final parking = await _getParking(NoParams());
    await parking.fold((f) async => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))), (p) async {
      final sms = await _getSms(NoParams());
      final status = await _getStatus(NoParams());
      emit(state.copyWith(viewState: ViewState.success, parking: p, sms: sms.fold((_) => null, (s) => s), smsStatus: status.fold((_) => null, (s) => s)));
    });
  }

  Future<void> _onParkingSaved(ProSettingsParkingSaved event, Emitter<ProSettingsState> emit) async {
    final parking = state.parking;
    if (parking == null) return;
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final result = await _updateParking(UpdateParkingParams(id: parking.id, input: event.input));
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: f.fields?.isNotEmpty == true ? null : _code(f), fieldErrors: f.fields ?? const {})),
      (p) => emit(state.copyWith(actionState: ViewState.success, parking: p, notice: 'settings.saved')),
    );
  }

  Future<void> _onSmsSaved(ProSettingsSmsSaved event, Emitter<ProSettingsState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final result = await _saveSms(event.input);
    await result.fold(
      (f) async =>
          emit(state.copyWith(actionState: ViewState.error, errorCode: f.fields?.isNotEmpty == true ? null : _code(f), fieldErrors: f.fields ?? const {})),
      (s) async {
        emit(state.copyWith(sms: s, notice: 'sms.saved', actionState: ViewState.success));
        if (event.testTo != null && s.mode == 'gateway') await _test(event.testTo!, emit);
        await _refreshStatus(emit);
      },
    );
  }

  Future<void> _onSmsTested(ProSettingsSmsTested event, Emitter<ProSettingsState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    await _test(event.to, emit);
    await _refreshStatus(emit);
  }

  Future<void> _test(String to, Emitter<ProSettingsState> emit) async {
    final result = await _testSms(to);
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (r) => emit(state.copyWith(actionState: ViewState.success, notice: r.outcome == 'queued' ? 'sms.test_queued:$to' : 'sms.test_sent:$to')),
    );
  }

  Future<void> _refreshStatus(Emitter<ProSettingsState> emit) async {
    final status = await _getStatus(NoParams());
    status.fold((_) {}, (s) => emit(state.copyWith(smsStatus: s)));
  }

  Future<void> _onSmsDisabled(ProSettingsSmsDisabled event, Emitter<ProSettingsState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final result = await _disableSms(NoParams());
    await result.fold((f) async => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))), (s) async {
      emit(state.copyWith(actionState: ViewState.success, sms: s, notice: 'sms.disabled'));
      await _refreshStatus(emit);
    });
  }

  Future<void> _onPassword(ProSettingsPasswordChanged event, Emitter<ProSettingsState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final result = await _changePassword(ChangePasswordParams(currentPassword: event.currentPassword, newPassword: event.newPassword));
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: f.fields?.isNotEmpty == true ? null : _code(f), fieldErrors: f.fields ?? const {})),
      (_) => emit(state.copyWith(actionState: ViewState.success, notice: 'account.password_changed')),
    );
  }
}

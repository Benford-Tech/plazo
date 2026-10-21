import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../data/models/extras_models.dart';
import '../../domain/usecases/extras_use_cases.dart';

part 'extra_settings_bloc.freezed.dart';

sealed class ExtraSettingsEvent {
  const ExtraSettingsEvent();
}

class ExtraSettingsStarted extends ExtraSettingsEvent {
  const ExtraSettingsStarted(this.parkingId);
  final String parkingId;
}

class ExtraSettingsSaved extends ExtraSettingsEvent {
  const ExtraSettingsSaved({required this.leadHours, required this.offers});
  final int leadHours;
  final List<ExtraSettingModel> offers;
}

class ExtraSettingsNoticeShown extends ExtraSettingsEvent {
  const ExtraSettingsNoticeShown();
}

@freezed
abstract class ExtraSettingsState with _$ExtraSettingsState {
  const factory ExtraSettingsState({
    String? parkingId,
    ExtraSettingsModel? data,
    @Default(false) bool saving,

    /// Field codes of the last save ("offers.ev_charge.priceCents": "range", "leadHours": "invalid").
    @Default(<String, String>{}) Map<String, String> fieldErrors,
    String? errorCode,
    String? notice,
  }) = _ExtraSettingsState;
}

/// « Services additionnels » in Plus › Réglages du parking (managers, 21/10/2026).
class ExtraSettingsBloc extends Bloc<ExtraSettingsEvent, ExtraSettingsState> {
  ExtraSettingsBloc(this._settings) : super(const ExtraSettingsState()) {
    on<ExtraSettingsStarted>(_onStarted);
    on<ExtraSettingsSaved>(_onSaved);
    on<ExtraSettingsNoticeShown>((e, emit) => emit(state.copyWith(notice: null, errorCode: null)));
  }

  final ExtraSettingsUseCases _settings;

  Future<void> _onStarted(ExtraSettingsStarted event, Emitter<ExtraSettingsState> emit) async {
    emit(state.copyWith(parkingId: event.parkingId));
    final result = await _settings.load(event.parkingId);
    result.fold((f) => emit(state.copyWith(errorCode: f.code ?? 'generic')), (data) => emit(state.copyWith(data: data)));
  }

  Future<void> _onSaved(ExtraSettingsSaved event, Emitter<ExtraSettingsState> emit) async {
    final id = state.parkingId;
    if (id == null || state.saving) return;
    emit(state.copyWith(saving: true, fieldErrors: const {}, errorCode: null, notice: null));
    final result = await _settings.save(id, leadHours: event.leadHours, offers: event.offers);
    result.fold(
      (f) => emit(state.copyWith(saving: false, fieldErrors: f.fields ?? const {}, errorCode: f.code ?? 'generic')),
      (data) => emit(state.copyWith(saving: false, data: data, notice: 'saved')),
    );
  }
}

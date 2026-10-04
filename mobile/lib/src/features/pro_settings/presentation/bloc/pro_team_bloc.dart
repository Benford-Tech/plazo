import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/settings_models.dart';
import '../../domain/usecases/settings_use_cases.dart';

part 'pro_team_bloc.freezed.dart';

sealed class ProTeamEvent {
  const ProTeamEvent();
}

class ProTeamStarted extends ProTeamEvent {
  const ProTeamStarted();
}

class ProTeamMemberCreated extends ProTeamEvent {
  const ProTeamMemberCreated(this.params);
  final NewStaffParams params;
}

class ProTeamMemberUpdated extends ProTeamEvent {
  const ProTeamMemberUpdated(this.params);
  final UpdateStaffParams params;
}

class ProTeamPasswordReset extends ProTeamEvent {
  const ProTeamPasswordReset(this.params);
  final ResetPasswordParams params;
}

class ProTeamNoticeShown extends ProTeamEvent {
  const ProTeamNoticeShown();
}

@freezed
abstract class ProTeamState with _$ProTeamState {
  const factory ProTeamState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    @Default([]) List<TeamMemberModel> members,

    /// "team.created", "team.updated", "team.password_reset".
    String? notice,
    String? errorCode,
    @Default({}) Map<String, String> fieldErrors,
  }) = _ProTeamState;
}

/// The operator's team: members, roles, access, temporary passwords (managers).
class ProTeamBloc extends Bloc<ProTeamEvent, ProTeamState> {
  ProTeamBloc(this._get, this._create, this._update, this._reset) : super(const ProTeamState()) {
    on<ProTeamStarted>(_onStarted);
    on<ProTeamMemberCreated>(_onCreated);
    on<ProTeamMemberUpdated>(_onUpdated);
    on<ProTeamPasswordReset>(_onReset);
    on<ProTeamNoticeShown>((e, emit) => emit(state.copyWith(notice: null, errorCode: null, actionState: ViewState.idle)));
  }

  final GetTeamUseCase _get;
  final CreateStaffUseCase _create;
  final UpdateStaffUseCase _update;
  final ResetStaffPasswordUseCase _reset;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProTeamStarted event, Emitter<ProTeamState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final result = await _get(NoParams());
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (list) => emit(state.copyWith(viewState: ViewState.success, members: list)),
    );
  }

  Future<void> _onCreated(ProTeamMemberCreated event, Emitter<ProTeamState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final result = await _create(event.params);
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: f.fields?.isNotEmpty == true ? null : _code(f), fieldErrors: f.fields ?? const {})),
      (m) => emit(state.copyWith(actionState: ViewState.success, members: [...state.members, m], notice: 'team.created')),
    );
  }

  Future<void> _onUpdated(ProTeamMemberUpdated event, Emitter<ProTeamState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null));
    final result = await _update(event.params);
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: _code(f))),
      (m) => emit(state.copyWith(actionState: ViewState.success, members: state.members.map((x) => x.id == m.id ? m : x).toList(), notice: 'team.updated')),
    );
  }

  Future<void> _onReset(ProTeamPasswordReset event, Emitter<ProTeamState> emit) async {
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final result = await _reset(event.params);
    result.fold(
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: f.fields?.isNotEmpty == true ? null : _code(f), fieldErrors: f.fields ?? const {})),
      (_) => emit(state.copyWith(actionState: ViewState.success, notice: 'team.password_reset')),
    );
  }
}

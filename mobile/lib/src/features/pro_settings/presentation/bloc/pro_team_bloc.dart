import 'dart:async';

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

/// « Code du jour » and the requests to join (13/10/2026), read again (pull to refresh, midnight).
class ProTeamJoinRefreshed extends ProTeamEvent {
  const ProTeamJoinRefreshed();
}

/// « Accepter comme … ».
class ProTeamJoinAccepted extends ProTeamEvent {
  const ProTeamJoinAccepted({required this.id, required this.role});
  final String id;
  final String role;
}

/// « Refuser ».
class ProTeamJoinRefused extends ProTeamEvent {
  const ProTeamJoinRefused(this.id);
  final String id;
}

@freezed
abstract class ProTeamState with _$ProTeamState {
  const factory ProTeamState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    @Default([]) List<TeamMemberModel> members,

    /// "team.created", "team.updated", "team.password_reset", "team.join_accepted", "team.join_refused".
    String? notice,

    /// The name in the notice (« Julie Martin a rejoint l'équipe. »).
    String? noticeArg,
    String? errorCode,
    @Default({}) Map<String, String> fieldErrors,

    /// « Code du jour » (managers, 13/10/2026), null until read.
    JoinCodeModel? joinCode,

    /// The requests to join the team, oldest first, and the one being accepted or refused.
    @Default([]) List<PendingJoinRequestModel> joinRequests,
    String? joinBusyId,
  }) = _ProTeamState;
}

/// The operator's team: members, roles, access, temporary passwords (managers); since 13/10/2026 the code du jour
/// and the requests to join the team (accept with a role, refuse).
class ProTeamBloc extends Bloc<ProTeamEvent, ProTeamState> {
  ProTeamBloc(
    this._get,
    this._create,
    this._update,
    this._reset, {
    this._joinCode,
    this._joinRequests,
    this._accept,
    this._refuse,
    Stream<Map<String, dynamic>>? pushOpened,
  }) : super(const ProTeamState()) {
    on<ProTeamStarted>(_onStarted);
    on<ProTeamJoinRefreshed>((e, emit) => _loadJoin(emit));
    on<ProTeamJoinAccepted>(_onAccepted);
    on<ProTeamJoinRefused>(_onRefused);
    on<ProTeamMemberCreated>(_onCreated);
    on<ProTeamMemberUpdated>(_onUpdated);
    on<ProTeamPasswordReset>(_onReset);
    // Also clears the field errors: a closed form (a cancelled « Modifier le nom ») leaves none behind.
    on<ProTeamNoticeShown>(
      (e, emit) => emit(state.copyWith(notice: null, noticeArg: null, errorCode: null, actionState: ViewState.idle, fieldErrors: const {})),
    );
    // A « Demande pour rejoindre l'équipe » notification opened while Équipe is already open: the router keeps this
    // page, so the requests are read again here.
    _pushes = pushOpened?.listen((data) {
      if (data['type'] == 'join_request' && !isClosed) add(const ProTeamJoinRefreshed());
    });
  }

  StreamSubscription<Map<String, dynamic>>? _pushes;

  final GetTeamUseCase _get;
  final CreateStaffUseCase _create;
  final UpdateStaffUseCase _update;
  final ResetStaffPasswordUseCase _reset;
  final GetJoinCodeUseCase? _joinCode;
  final GetJoinRequestsUseCase? _joinRequests;
  final AcceptJoinRequestUseCase? _accept;
  final RefuseJoinRequestUseCase? _refuse;

  /// Reads the code again just after local midnight, while the page stays open.
  Timer? _midnight;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onStarted(ProTeamStarted event, Emitter<ProTeamState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final result = await _get(NoParams());
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (list) => emit(state.copyWith(viewState: ViewState.success, members: list)),
    );
    await _loadJoin(emit);
  }

  /// The code and the requests; a failure leaves them out (the team list works without them).
  Future<void> _loadJoin(Emitter<ProTeamState> emit) async {
    final code = await _joinCode?.call(NoParams());
    final requests = await _joinRequests?.call(NoParams());
    if (isClosed) return;
    emit(
      state.copyWith(
        joinCode: code?.fold((_) => state.joinCode, (c) => c) ?? state.joinCode,
        joinRequests: requests?.fold((_) => state.joinRequests, (r) => r) ?? state.joinRequests,
      ),
    );
    _scheduleMidnight();
  }

  void _scheduleMidnight() {
    _midnight?.cancel();
    final until = state.joinCode?.validUntil;
    if (until == null) return;
    final wait = until.difference(DateTime.now()) + const Duration(seconds: 2);
    _midnight = Timer(wait.isNegative ? const Duration(seconds: 30) : wait, () {
      if (!isClosed) add(const ProTeamJoinRefreshed());
    });
  }

  Future<void> _onAccepted(ProTeamJoinAccepted event, Emitter<ProTeamState> emit) async {
    final accept = _accept;
    if (accept == null) return;
    emit(state.copyWith(joinBusyId: event.id, errorCode: null));
    final result = await accept(AcceptJoinParams(id: event.id, role: event.role));
    result.fold(
      (f) {
        // Closed elsewhere (another manager, expired): out of the list.
        final gone = f.code == 'join_request_closed' || f.code == 'not_found';
        emit(
          state.copyWith(
            joinBusyId: null,
            errorCode: _code(f),
            joinRequests: gone ? state.joinRequests.where((r) => r.id != event.id).toList() : state.joinRequests,
          ),
        );
      },
      (member) => emit(
        state.copyWith(
          joinBusyId: null,
          members: [...state.members.where((m) => m.id != member.id), member],
          joinRequests: state.joinRequests.where((r) => r.id != event.id).toList(),
          notice: 'team.join_accepted',
          noticeArg: member.name,
        ),
      ),
    );
  }

  Future<void> _onRefused(ProTeamJoinRefused event, Emitter<ProTeamState> emit) async {
    final refuse = _refuse;
    if (refuse == null) return;
    final request = state.joinRequests.where((r) => r.id == event.id).firstOrNull;
    emit(state.copyWith(joinBusyId: event.id, errorCode: null));
    final result = await refuse(event.id);
    result.fold(
      (f) {
        final gone = f.code == 'join_request_closed' || f.code == 'not_found';
        emit(
          state.copyWith(
            joinBusyId: null,
            errorCode: _code(f),
            joinRequests: gone ? state.joinRequests.where((r) => r.id != event.id).toList() : state.joinRequests,
          ),
        );
      },
      (_) => emit(
        state.copyWith(
          joinBusyId: null,
          joinRequests: state.joinRequests.where((r) => r.id != event.id).toList(),
          notice: 'team.join_refused',
          noticeArg: request?.name,
        ),
      ),
    );
  }

  @override
  Future<void> close() async {
    _midnight?.cancel();
    await _pushes?.cancel();
    return super.close();
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
    emit(state.copyWith(actionState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final result = await _update(event.params);
    result.fold(
      // A refused name (« Modifier le nom ») is shown under its field.
      (f) => emit(state.copyWith(actionState: ViewState.error, errorCode: f.fields?.isNotEmpty == true ? null : _code(f), fieldErrors: f.fields ?? const {})),
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

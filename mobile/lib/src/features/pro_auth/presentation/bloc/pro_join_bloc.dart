import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/helpers/join_code.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/datasources/onboarding_data_source.dart';
import '../../data/models/onboarding_models.dart';
import '../../data/models/staff_model.dart';
import '../../domain/usecases/identity_use_cases.dart';

part 'pro_join_bloc.freezed.dart';

sealed class ProJoinEvent {
  const ProJoinEvent();
}

/// The page opens with what the sign-in (or the restore) said; the API is asked again at once.
class ProJoinStarted extends ProJoinEvent {
  const ProJoinStarted([this.initial]);
  final OnboardingModel? initial;
}

/// « Envoyer ma demande ».
class ProJoinSubmitted extends ProJoinEvent {
  const ProJoinSubmitted({required this.code, required this.firstName, required this.lastName, required this.wishedRole});
  final String code;
  final String firstName;
  final String lastName;

  /// agent, driver, valet; null while « Je suis » has no choice.
  final String? wishedRole;
}

/// The waiting screen asks whether a manager answered (every 10 s, and when the app comes back).
class ProJoinRefreshed extends ProJoinEvent {
  const ProJoinRefreshed();
}

/// « Annuler la demande ».
class ProJoinCancelRequested extends ProJoinEvent {
  const ProJoinCancelRequested();
}

/// « Taper un nouveau code » after a refused, expired or cancelled request.
class ProJoinNewCodeRequested extends ProJoinEvent {
  const ProJoinNewCodeRequested();
}

/// The app went to the background: no polling there.
class ProJoinPaused extends ProJoinEvent {
  const ProJoinPaused();
}

/// The app is back: one question now, then every 10 s again.
class ProJoinResumed extends ProJoinEvent {
  const ProJoinResumed();
}

/// A general error was shown.
class ProJoinErrorShown extends ProJoinEvent {
  const ProJoinErrorShown();
}

/// What the page shows: the form, the wait for the manager, a closed request, or the session opening.
enum ProJoinView { form, waiting, closed, accepted }

@freezed
abstract class ProJoinState with _$ProJoinState {
  const ProJoinState._();

  const factory ProJoinState({
    IdentityModel? identity,
    JoinRequestModel? request,

    /// The form is shown again (« Taper un nouveau code », or the request just cancelled).
    @Default(false) bool editing,
    @Default(ViewState.idle) ViewState submitState,
    @Default(ViewState.idle) ViewState cancelState,

    /// Opening the staff session once accepted; [session] is then the member.
    @Default(ViewState.idle) ViewState sessionState,
    StaffModel? session,

    /// The code's error (join_code_incomplete, join_code_invalid), the other fields' (firstName, lastName, wishedRole).
    String? codeError,
    @Default(<String, String>{}) Map<String, String> fieldErrors,

    /// Any other error (too_many_attempts, email_taken, already_member, network…).
    String? errorCode,
  }) = _ProJoinState;

  ProJoinView get view {
    final r = request;
    if (r == null || editing) return ProJoinView.form;
    if (r.isPending) return ProJoinView.waiting;
    if (r.isAccepted) return ProJoinView.accepted;
    return ProJoinView.closed;
  }
}

/// « Rejoindre un parking » (13/10/2026): the code du jour, the person's names and post, then the wait for a manager
/// (asked every 10 s, never in the background), until the request is accepted and the staff session opens.
class ProJoinBloc extends Bloc<ProJoinEvent, ProJoinState> {
  ProJoinBloc(this._get, this._join, this._cancel, this._open, {this._pollInterval = AppConstants.joinPollInterval}) : super(const ProJoinState()) {
    on<ProJoinStarted>(_onStarted);
    on<ProJoinSubmitted>(_onSubmitted);
    on<ProJoinRefreshed>(_onRefreshed);
    on<ProJoinCancelRequested>(_onCancel);
    on<ProJoinNewCodeRequested>((e, emit) => emit(state.copyWith(editing: true, codeError: null, fieldErrors: const {}, errorCode: null)));
    on<ProJoinPaused>((e, emit) {
      _paused = true;
      _sync();
    });
    on<ProJoinResumed>((e, emit) {
      _paused = false;
      if (state.request?.isPending == true) add(const ProJoinRefreshed());
      _sync();
    });
    on<ProJoinErrorShown>((e, emit) => emit(state.copyWith(errorCode: null, cancelState: ViewState.idle)));
  }

  final GetOnboardingUseCase _get;
  final JoinParkingUseCase _join;
  final CancelJoinRequestUseCase _cancel;
  final OpenJoinedSessionUseCase _open;
  final Duration _pollInterval;
  Timer? _timer;
  bool _paused = false;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  /// Polls while a request waits and the app is in front, else stops.
  void _sync() {
    final waiting = state.request?.isPending == true && !state.editing && !_paused && !isClosed;
    if (!waiting) {
      _timer?.cancel();
      _timer = null;
    } else {
      _timer ??= Timer.periodic(_pollInterval, (_) {
        if (!isClosed) add(const ProJoinRefreshed());
      });
    }
  }

  void _emit(Emitter<ProJoinState> emit, ProJoinState next) {
    emit(next);
    _sync();
  }

  Future<void> _onStarted(ProJoinStarted event, Emitter<ProJoinState> emit) async {
    final initial = event.initial;
    if (initial != null) _emit(emit, state.copyWith(identity: initial.identity, request: initial.request));
    if (state.request?.isAccepted == true) return _openSession(emit);
    await _onRefreshed(const ProJoinRefreshed(), emit);
  }

  Future<void> _onRefreshed(ProJoinRefreshed event, Emitter<ProJoinState> emit) async {
    if (state.sessionState.isProcessing || state.session != null) return;
    final result = await _get(NoParams());
    // A failed poll changes nothing: the next one will tell (a refused token is handled by ProAuthBloc).
    final onboarding = result.fold((_) => null, (o) => o);
    if (onboarding == null || isClosed) return;
    final request = onboarding.request;
    final keepForm = state.editing && (request == null || !request.isPending && !request.isAccepted);
    _emit(emit, state.copyWith(identity: onboarding.identity, request: request ?? (state.editing ? state.request : null), editing: keepForm));
    if (request?.isAccepted == true) await _openSession(emit);
  }

  Future<void> _openSession(Emitter<ProJoinState> emit) async {
    _emit(emit, state.copyWith(sessionState: ViewState.processing, errorCode: null));
    final result = await _open(NoParams());
    result.fold(
      (f) => _emit(emit, state.copyWith(sessionState: ViewState.error, errorCode: _code(f))),
      (staff) => _emit(emit, state.copyWith(sessionState: ViewState.success, session: staff)),
    );
  }

  Future<void> _onSubmitted(ProJoinSubmitted event, Emitter<ProJoinState> emit) async {
    final code = normalizeJoinCode(event.code);
    final fields = <String, String>{
      if (event.firstName.trim().isEmpty) 'firstName': 'required',
      if (event.lastName.trim().isEmpty) 'lastName': 'required',
      if (event.wishedRole == null) 'wishedRole': 'wished_role_required',
    };
    if (code == null || fields.isNotEmpty) {
      return emit(state.copyWith(submitState: ViewState.error, codeError: code == null ? 'join_code_incomplete' : null, fieldErrors: fields, errorCode: null));
    }
    emit(state.copyWith(submitState: ViewState.processing, codeError: null, fieldErrors: const {}, errorCode: null));
    final result = await _join(JoinInput(code: code, firstName: event.firstName, lastName: event.lastName, wishedRole: event.wishedRole!));
    await result.fold((f) async {
      final fields = Map<String, String>.of(f.fields ?? const {});
      final codeError = f.code == 'join_code_invalid' ? 'join_code_invalid' : fields.remove('code');
      if (f.code == 'join_request_pending') {
        // A request already waits (sent from another phone): show it.
        emit(state.copyWith(submitState: ViewState.idle, editing: false));
        return _onRefreshed(const ProJoinRefreshed(), emit);
      }
      final general = codeError != null || fields.isNotEmpty ? null : _code(f);
      emit(state.copyWith(submitState: ViewState.error, codeError: codeError, fieldErrors: fields, errorCode: general));
    }, (request) async => _emit(emit, state.copyWith(submitState: ViewState.success, request: request, editing: false)));
  }

  Future<void> _onCancel(ProJoinCancelRequested event, Emitter<ProJoinState> emit) async {
    _emit(emit, state.copyWith(cancelState: ViewState.processing, errorCode: null));
    final result = await _cancel(NoParams());
    result.fold(
      (f) => _emit(emit, state.copyWith(cancelState: ViewState.error, errorCode: _code(f))),
      // Back to the form at once: the person cancelled it themself.
      (request) => _emit(emit, state.copyWith(cancelState: ViewState.success, request: request, editing: true, submitState: ViewState.idle)),
    );
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}

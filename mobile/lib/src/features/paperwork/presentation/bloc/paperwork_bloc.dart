import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../../data/models/paperwork_models.dart';
import '../../domain/usecases/paperwork_use_cases.dart';

part 'paperwork_bloc.freezed.dart';

sealed class PaperworkEvent {
  const PaperworkEvent();
}

class PaperworkStarted extends PaperworkEvent {
  const PaperworkStarted(this.owner, {this.startKind});
  final PaperworkOwner owner;

  /// Plazo Pro opening a report: started on the server at once (or the one already started is returned). The traveller's
  /// own photos start with the first one.
  final String? startKind;
}

class PaperworkRefreshed extends PaperworkEvent {
  const PaperworkRefreshed();
}

class PaperworkCodeRequested extends PaperworkEvent {
  const PaperworkCodeRequested();
}

class PaperworkSigned extends PaperworkEvent {
  const PaperworkSigned({this.code, this.strokes});
  final String? code;
  final List<List<List<double>>>? strokes;
}

class PaperworkAnswered extends PaperworkEvent {
  const PaperworkAnswered(this.kind, {required this.decision, this.reserveText, this.strokes});
  final String kind;
  final String decision;
  final String? reserveText;
  final List<List<List<double>>>? strokes;
}

/// A change to a report being taken (staff): photos, damages, mileage, fuel, completion.
class PaperworkEdited extends PaperworkEvent {
  const PaperworkEdited(this.edit, {this.busySlot});
  final InspectionEdit edit;

  /// The guided slot being uploaded (its tile spins).
  final String? busySlot;
}

class PaperworkErrorDismissed extends PaperworkEvent {
  const PaperworkErrorDismissed();
}

@freezed
abstract class PaperworkState with _$PaperworkState {
  const PaperworkState._();

  const factory PaperworkState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    PaperworkOwner? owner,
    PaperworkModel? data,
    CodeSentModel? codeSent,
    String? busySlot,

    /// The last action's failure: its code, its fields' codes and its French message.
    String? errorCode,
    Map<String, String>? errorFields,
    String? errorMessage,

    /// What just happened, for a snackbar: signed, answered, completed.
    String? notice,
  }) = _PaperworkState;

  bool get busy => actionState.isProcessing;
}

/// One booking's contract and condition reports (19/10/2026), for the staff (Plazo Pro) or the traveller (Plazo).
class PaperworkBloc extends Bloc<PaperworkEvent, PaperworkState> {
  PaperworkBloc(this._load, this._sendCode, this._sign, this._answer, this._edit) : super(const PaperworkState()) {
    on<PaperworkStarted>(_onStarted);
    on<PaperworkRefreshed>((e, emit) => _reload(emit));
    on<PaperworkCodeRequested>(_onCodeRequested);
    on<PaperworkSigned>(_onSigned);
    on<PaperworkAnswered>(_onAnswered);
    on<PaperworkEdited>(_onEdited);
    on<PaperworkErrorDismissed>((e, emit) => emit(state.copyWith(errorCode: null, errorFields: null, errorMessage: null, notice: null)));
  }

  final LoadPaperworkUseCase _load;
  final SendSignatureCodeUseCase _sendCode;
  final SignContractUseCase _sign;
  final AnswerInspectionUseCase _answer;
  final EditInspectionUseCase _edit;

  Future<void> _onStarted(PaperworkStarted event, Emitter<PaperworkState> emit) async {
    emit(state.copyWith(owner: event.owner, viewState: ViewState.processing));
    final owner = event.owner;
    final result = event.startKind != null ? await _edit(StartInspection(owner, event.startKind!)) : await _load(owner);
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: f.code ?? 'generic', errorMessage: f.message)),
      (data) => emit(state.copyWith(viewState: ViewState.success, data: data)),
    );
  }

  Future<void> _reload(Emitter<PaperworkState> emit) async {
    final owner = state.owner;
    if (owner == null) return;
    final result = await _load(owner);
    result.fold((_) {}, (data) => emit(state.copyWith(viewState: ViewState.success, data: data)));
  }

  void _fail(Emitter<PaperworkState> emit, Failure f) =>
      emit(state.copyWith(actionState: ViewState.error, busySlot: null, errorCode: f.code ?? 'generic', errorFields: f.fields, errorMessage: f.message));

  Future<void> _onCodeRequested(PaperworkCodeRequested event, Emitter<PaperworkState> emit) async {
    final owner = state.owner;
    if (owner == null || state.busy) return;
    emit(state.copyWith(actionState: ViewState.processing));
    final result = await _sendCode(owner);
    result.fold((f) => _fail(emit, f), (sent) => emit(state.copyWith(actionState: ViewState.success, codeSent: sent)));
  }

  Future<void> _onSigned(PaperworkSigned event, Emitter<PaperworkState> emit) async {
    final owner = state.owner;
    if (owner == null || state.busy) return;
    emit(state.copyWith(actionState: ViewState.processing));
    final result = await _sign(SignContractParams(owner, code: event.code, strokes: event.strokes));
    result.fold((f) => _fail(emit, f), (data) => emit(state.copyWith(actionState: ViewState.success, data: data, notice: 'signed')));
  }

  Future<void> _onAnswered(PaperworkAnswered event, Emitter<PaperworkState> emit) async {
    final owner = state.owner;
    if (owner == null || state.busy) return;
    emit(state.copyWith(actionState: ViewState.processing));
    final result = await _answer(AnswerInspectionParams(owner, event.kind, decision: event.decision, reserveText: event.reserveText, strokes: event.strokes));
    result.fold((f) => _fail(emit, f), (data) => emit(state.copyWith(actionState: ViewState.success, data: data, notice: 'answered')));
  }

  Future<void> _onEdited(PaperworkEdited event, Emitter<PaperworkState> emit) async {
    if (state.busy) return;
    emit(state.copyWith(actionState: ViewState.processing, busySlot: event.busySlot));
    final result = await _edit(event.edit);
    result.fold(
      (f) => _fail(emit, f),
      (data) => emit(state.copyWith(actionState: ViewState.success, busySlot: null, data: data, notice: event.edit is CompleteInspection ? 'completed' : null)),
    );
  }
}

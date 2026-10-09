import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../data/models/reservation_models.dart';
import '../../domain/usecases/reservations_use_cases.dart';

part 'pro_reservation_form_bloc.freezed.dart';

sealed class ProReservationFormEvent {
  const ProReservationFormEvent();
}

/// Edits [input]; when the stay changed, the capacity is checked again.
class ProReservationFormChanged extends ProReservationFormEvent {
  const ProReservationFormChanged(this.input);
  final ReservationInput input;
}

class ProReservationFormSubmitted extends ProReservationFormEvent {
  const ProReservationFormSubmitted();
}

@freezed
abstract class ProReservationFormState with _$ProReservationFormState {
  const ProReservationFormState._();

  const factory ProReservationFormState({
    /// Null for a new booking.
    String? id,
    required ReservationInput input,
    @Default(ViewState.idle) ViewState saveState,
    CapacityPreviewModel? capacity,
    @Default(false) bool checkingCapacity,
    ReservationModel? saved,
    String? errorCode,
    @Default({}) Map<String, String> fieldErrors,
  }) = _ProReservationFormState;

  bool get full => (capacity?.fullNights.isNotEmpty ?? false) && !input.force;
}

/// New booking, edit, or a booking read from a confirmation email: the form's rules and save.
class ProReservationFormBloc extends Bloc<ProReservationFormEvent, ProReservationFormState> {
  ProReservationFormBloc(this._save, this._capacity, {String? id, required ReservationInput initial})
    : _initial = initial,
      super(ProReservationFormState(id: id, input: initial)) {
    on<ProReservationFormChanged>(_onChanged);
    on<ProReservationFormSubmitted>(_onSubmitted);
    add(ProReservationFormChanged(initial));
  }

  final SaveReservationUseCase _save;
  final PreviewCapacityUseCase _capacity;

  /// The values the form opened with: an edit sends the name only once changed.
  final ReservationInput _initial;
  bool _checkedOnce = false;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onChanged(ProReservationFormChanged event, Emitter<ProReservationFormState> emit) async {
    // Checked again only when the stay changes (the first check comes from the constructor).
    final stayChanged = !_checkedOnce || event.input.arrivalAt != state.input.arrivalAt || event.input.returnAt != state.input.returnAt;
    _checkedOnce = true;
    emit(state.copyWith(input: event.input, fieldErrors: const {}, errorCode: null));
    if (!stayChanged || event.input.arrivalAt.isEmpty || event.input.returnAt.isEmpty) return;
    emit(state.copyWith(checkingCapacity: true));
    final result = await _capacity(CapacityParams(arrivalAt: event.input.arrivalAt, returnAt: event.input.returnAt, excludeId: state.id));
    if (state.input.arrivalAt != event.input.arrivalAt || state.input.returnAt != event.input.returnAt) return;
    result.fold(
      // Inconsistent dates: the save will say which field.
      (f) => emit(state.copyWith(checkingCapacity: false, capacity: null, fieldErrors: f.fields ?? const {})),
      (c) => emit(state.copyWith(checkingCapacity: false, capacity: c)),
    );
  }

  Future<void> _onSubmitted(ProReservationFormSubmitted event, Emitter<ProReservationFormState> emit) async {
    emit(state.copyWith(saveState: ViewState.processing, errorCode: null, fieldErrors: const {}));
    final names = state.id == null || !state.input.sameNameAs(_initial);
    final result = await _save(SaveReservationParams(id: state.id, input: state.input, names: names));
    result.fold(
      (f) => emit(state.copyWith(saveState: ViewState.error, errorCode: f.fields?.isNotEmpty == true ? null : _code(f), fieldErrors: f.fields ?? const {})),
      (r) => emit(state.copyWith(saveState: ViewState.success, saved: r)),
    );
  }
}

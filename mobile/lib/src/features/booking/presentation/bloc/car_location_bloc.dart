import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../../../services/location_service.dart';
import '../../data/models/public_booking_model.dart';
import '../../domain/usecases/booking_actions_use_cases.dart';

part 'car_location_bloc.freezed.dart';

sealed class CarLocationEvent {
  const CarLocationEvent();
}

/// "Enregistrer où je suis garé": asks the location permission, takes one fix, sends it.
class CarLocationRequested extends CarLocationEvent {
  const CarLocationRequested({required this.reference, this.note});
  final String reference;
  final String? note;
}

class CarLocationCleared extends CarLocationEvent {
  const CarLocationCleared(this.reference);
  final String reference;
}

class CarLocationErrorDismissed extends CarLocationEvent {
  const CarLocationErrorDismissed();
}

@freezed
abstract class CarLocationState with _$CarLocationState {
  const CarLocationState._();

  const factory CarLocationState({
    @Default(ViewState.idle) ViewState viewState,

    /// The booking as the API returned it after the last action (the page refreshes from it).
    PublicBookingModel? booking,
    String? errorCode,
    LocationAccess? locationProblem,
    @Default(false) bool noFix,
  }) = _CarLocationState;
}

/// Where the car is parked (06/10/2026), traveller side: one GPS fix taken on demand (the
/// permission is asked at that moment, nothing is stored on the phone), sent with the note.
class CarLocationBloc extends Bloc<CarLocationEvent, CarLocationState> {
  CarLocationBloc(this._locate, this._clear, this._location) : super(const CarLocationState()) {
    on<CarLocationRequested>(_onRequested);
    on<CarLocationCleared>(_onCleared);
    on<CarLocationErrorDismissed>((e, emit) => emit(state.copyWith(viewState: ViewState.idle, errorCode: null, locationProblem: null, noFix: false)));
  }

  final LocateCarUseCase _locate;
  final ClearCarUseCase _clear;
  final LocationService _location;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onRequested(CarLocationRequested event, Emitter<CarLocationState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null, locationProblem: null, noFix: false));
    final access = await _location.requestAccess();
    if (access != LocationAccess.granted) {
      emit(state.copyWith(viewState: ViewState.error, locationProblem: access));
      return;
    }
    final position = await _location.current();
    if (position == null) {
      emit(state.copyWith(viewState: ViewState.error, noFix: true));
      return;
    }
    final result = await _locate(LocateCarParams(reference: event.reference, position: position, note: event.note));
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (booking) => emit(state.copyWith(viewState: ViewState.success, booking: booking)),
    );
  }

  Future<void> _onCleared(CarLocationCleared event, Emitter<CarLocationState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final result = await _clear(event.reference);
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (booking) => emit(state.copyWith(viewState: ViewState.success, booking: booking)),
    );
  }
}

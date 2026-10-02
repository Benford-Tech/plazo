import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../../core/enums/view_state.dart';
import '../../../data/models/public_models.dart';
import '../../../domain/usecases/public_use_cases.dart';

part 'parking_bloc.freezed.dart';

sealed class ParkingEvent {
  const ParkingEvent();
}

class ParkingRequested extends ParkingEvent {
  const ParkingRequested();
}

/// New dates from the date sheet (or the first ones, on a page opened without dates).
class ParkingStayChanged extends ParkingEvent {
  const ParkingStayChanged({required this.arrivalAt, required this.returnAt});
  final String arrivalAt;
  final String returnAt;
}

@freezed
abstract class ParkingState with _$ParkingState {
  const ParkingState._();

  const factory ParkingState({
    required String airport,
    required String slug,
    String? arrivalAt,
    String? returnAt,
    @Default(ViewState.idle) ViewState loadState,
    ParkingResponseModel? response,
    String? errorMessage,
  }) = _ParkingState;

  OfferModel? get offer => response?.offer;

  /// "online", "on_site" or "unavailable" (not bookable in the app yet).
  String get payment => response?.parking.payment ?? 'on_site';

  bool get bookable => (offer?.bookable ?? false) && payment != 'unavailable';
}

/// A3, a parking's page: the same content as the site's, with the offer for the stay.
class ParkingBloc extends Bloc<ParkingEvent, ParkingState> {
  ParkingBloc(this._get, {required String airport, required String slug, String? arrivalAt, String? returnAt})
    : super(ParkingState(airport: airport, slug: slug, arrivalAt: arrivalAt, returnAt: returnAt)) {
    on<ParkingRequested>(_onRequested);
    on<ParkingStayChanged>((event, emit) async {
      emit(state.copyWith(arrivalAt: event.arrivalAt, returnAt: event.returnAt));
      await _onRequested(const ParkingRequested(), emit);
    });
  }

  final GetParkingUseCase _get;

  Future<void> _onRequested(ParkingRequested event, Emitter<ParkingState> emit) async {
    emit(state.copyWith(loadState: ViewState.processing, errorMessage: null));
    final result = await _get(StayParams(airport: state.airport, parking: state.slug, arrivalAt: state.arrivalAt, returnAt: state.returnAt));
    result.fold(
      (failure) => emit(state.copyWith(loadState: ViewState.error, errorMessage: failure.message)),
      (response) => emit(state.copyWith(loadState: ViewState.success, response: response)),
    );
  }
}

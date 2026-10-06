import 'dart:math';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/plate.dart';
import '../../../booking/data/models/public_booking_model.dart';
import '../../../booking/domain/usecases/booking_actions_use_cases.dart';
import '../../../search/data/models/public_models.dart';
import '../../../search/domain/usecases/public_use_cases.dart';
import '../../domain/booking_draft.dart';

part 'booking_form_bloc.freezed.dart';

sealed class BookingFormEvent {
  const BookingFormEvent();
}

class BookingFormStarted extends BookingFormEvent {
  const BookingFormStarted();
}

class BookingFormSubmitted extends BookingFormEvent {
  const BookingFormSubmitted(this.draft);
  final BookingDraft draft;
}

@freezed
abstract class BookingFormState with _$BookingFormState {
  const BookingFormState._();

  const factory BookingFormState({
    required String airport,
    required String parking,
    required String arrivalAt,
    required String returnAt,
    @Default(ViewState.idle) ViewState loadState,
    ParkingResponseModel? parkingResponse,
    BookingDraft? draft,
    @Default(ViewState.idle) ViewState submitState,
    /// API codes per field ("invalid_phone"…), from the app's checks or the API's.
    @Default(<String, String>{}) Map<String, String> fieldErrors,
    /// General API code ("overbooked", "validation_failed"…).
    String? errorCode,
    @Default(<String>[]) List<String> fullNights,
    CreatedBookingModel? created,
  }) = _BookingFormState;

  /// Paid by card on the next step (otherwise at the parking).
  bool get online => parkingResponse?.parking.payment == 'online';

  int? get priceCents => parkingResponse?.offer?.priceCents;

  int? get days => parkingResponse?.offer?.days;

  /// The booking cannot be made for these dates any more (the form shows the alternatives).
  bool get unavailable => const ['overbooked', 'no_price', 'not_found'].contains(errorCode);
}

/// Same checks as the API's (CreatePublicBookingDto), so that obvious mistakes are shown at once;
/// the API checks everything again and its field codes are shown the same way.
Map<String, String> validateBookingDraft(BookingDraft d) {
  final errors = <String, String>{};
  final name = d.customerName.trim();
  if (name.isEmpty) {
    errors['customerName'] = 'required';
  } else if (name.length > 120) {
    errors['customerName'] = 'too_long';
  } else if (!RegExp(r"^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$", unicode: true).hasMatch(name) || RegExp(r'\.\p{L}{2,}', unicode: true).hasMatch(name)) {
    errors['customerName'] = 'invalid_name';
  }
  final phone = d.customerPhone.trim();
  if (phone.isEmpty) {
    errors['customerPhone'] = 'required';
  } else if (!RegExp(r'^\+?[0-9 .()-]{6,20}$').hasMatch(phone)) {
    errors['customerPhone'] = 'invalid_phone';
  }
  final email = d.customerEmail.trim();
  if (email.isEmpty) {
    errors['customerEmail'] = 'required';
  } else if (email.length > 254 || !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$').hasMatch(email)) {
    errors['customerEmail'] = 'invalid_email';
  }
  final plate = d.plate.trim();
  if (plate.isEmpty) {
    errors['plate'] = 'required';
  } else if (!RegExp(r'^[A-Za-z0-9 -]{2,15}$').hasMatch(formatPlate(plate))) {
    errors['plate'] = 'invalid_plate';
  }
  if (d.returnFlight.trim().length > 10) errors['returnFlight'] = 'invalid_flight';
  if (d.departureFlight.trim().length > 10) errors['departureFlight'] = 'invalid_flight';
  if (d.passengers < 1 || d.passengers > 9) errors['passengers'] = 'passengers_range';
  if (!d.acceptTerms) errors['acceptTerms'] = 'terms_required';
  return errors;
}

/// A random key per form shown (as the site's): sending the form again (a retry after a timeout,
/// a double tap) returns the booking already made instead of a second one.
String newIdempotencyKey([Random? random]) {
  final r = random ?? Random.secure();
  return List.generate(32, (_) => r.nextInt(16).toRadixString(16)).join();
}

/// A4, step 1 "Vos informations": the recap comes from the parking's page (price computed by the
/// API), the booking is made by the API, which checks every rule again.
class BookingFormBloc extends Bloc<BookingFormEvent, BookingFormState> {
  BookingFormBloc(
    this._parking,
    this._create,
    this._drafts, {
    required String airport,
    required String parking,
    required String arrivalAt,
    required String returnAt,
    String? idempotencyKey,
  }) : _key = idempotencyKey ?? newIdempotencyKey(),
       super(BookingFormState(airport: airport, parking: parking, arrivalAt: arrivalAt, returnAt: returnAt, draft: _drafts.draft)) {
    on<BookingFormStarted>(_onStarted);
    on<BookingFormSubmitted>(_onSubmitted);
  }

  final GetParkingUseCase _parking;
  final CreateBookingUseCase _create;
  final BookingDraftStore _drafts;
  final String _key;

  Future<void> _onStarted(BookingFormStarted event, Emitter<BookingFormState> emit) async {
    emit(state.copyWith(loadState: ViewState.processing));
    final result = await _parking(StayParams(airport: state.airport, parking: state.parking, arrivalAt: state.arrivalAt, returnAt: state.returnAt));
    result.fold(
      (f) => emit(state.copyWith(loadState: ViewState.error, errorCode: f.fields?.values.firstOrNull ?? f.code)),
      (response) => emit(state.copyWith(loadState: ViewState.success, parkingResponse: response)),
    );
  }

  Future<void> _onSubmitted(BookingFormSubmitted event, Emitter<BookingFormState> emit) async {
    final draft = event.draft;
    _drafts.save(draft);
    final errors = validateBookingDraft(draft);
    if (errors.isNotEmpty) {
      emit(state.copyWith(draft: draft, fieldErrors: errors, errorCode: 'validation_failed', submitState: ViewState.error, fullNights: const []));
      return;
    }
    emit(state.copyWith(draft: draft, submitState: ViewState.processing, fieldErrors: const {}, errorCode: null, fullNights: const []));
    final result = await _create(
      BookingInput(
        airport: state.airport,
        parking: state.parking,
        arrivalAt: state.arrivalAt,
        returnAt: state.returnAt,
        customerName: draft.customerName.trim(),
        customerPhone: draft.customerPhone.trim(),
        customerEmail: draft.customerEmail.trim(),
        plate: formatPlate(draft.plate),
        returnFlight: draft.returnFlight.trim().isEmpty ? null : draft.returnFlight.trim().toUpperCase(),
        departureFlight: draft.departureFlight.trim().isEmpty ? null : draft.departureFlight.trim().toUpperCase(),
        passengers: draft.passengers,
        acceptTerms: draft.acceptTerms,
        idempotencyKey: _key,
      ),
    );
    result.fold(
      (f) {
        final nights = f.details?['fullNights'];
        emit(
          state.copyWith(
            submitState: ViewState.error,
            fieldErrors: f.fields ?? const {},
            errorCode: f.code ?? 'generic',
            fullNights: nights is List ? nights.whereType<String>().toList() : const [],
          ),
        );
      },
      (created) {
        // Paid at the parking: confirmed now, nothing to keep. Paid online: kept until paid.
        if (created.booking.status != 'pending_payment') _drafts.clear();
        emit(state.copyWith(submitState: ViewState.success, created: created));
      },
    );
  }
}

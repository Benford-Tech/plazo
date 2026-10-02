import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/public_booking_model.dart';
import '../../domain/usecases/get_booking_use_case.dart';
import '../../domain/usecases/lookup_booking_use_case.dart';
import '../../domain/usecases/save_booking_access_use_case.dart';
import '../../domain/usecases/saved_bookings_use_case.dart';

part 'booking_bloc.freezed.dart';
part 'booking_event.dart';
part 'booking_state.dart';

/// Opens a traveller's booking: from the link of the confirmation email/SMS (deep link with its
/// manage token), or by reference + email. The token is kept in the secure storage only.
class BookingBloc extends Bloc<BookingEvent, BookingState> {
  BookingBloc(this._lookup, this._get, this._saveAccess, this._saved) : super(const BookingState()) {
    on<BookingSavedRequested>(_onSaved);
    on<BookingLinkOpened>(_onLinkOpened);
    on<BookingLookupSubmitted>(_onLookup);
    on<BookingRefreshed>(_onRefreshed);
  }

  final LookupBookingUseCase _lookup;
  final GetBookingUseCase _get;
  final SaveBookingAccessUseCase _saveAccess;
  final SavedBookingsUseCase _saved;

  Future<void> _onSaved(BookingSavedRequested event, Emitter<BookingState> emit) async {
    final result = await _saved(NoParams());
    result.fold((_) {}, (refs) => emit(state.copyWith(savedReferences: refs)));
  }

  Future<void> _onLinkOpened(BookingLinkOpened event, Emitter<BookingState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorMessage: null, reference: event.reference.toUpperCase()));
    final token = event.token;
    if (token != null && token.isNotEmpty) {
      await _saveAccess(SaveBookingAccessParams(reference: event.reference, token: token));
    }
    await _load(event.reference, emit);
  }

  Future<void> _onLookup(BookingLookupSubmitted event, Emitter<BookingState> emit) async {
    emit(state.copyWith(lookupState: ViewState.processing, errorMessage: null));
    final result = await _lookup(LookupBookingParams(reference: event.reference, email: event.email));
    await result.fold(
      (failure) async => emit(state.copyWith(lookupState: ViewState.error, errorMessage: failure.message)),
      (access) async {
        emit(state.copyWith(lookupState: ViewState.success, reference: access.reference));
        await _load(access.reference, emit);
      },
    );
  }

  Future<void> _onRefreshed(BookingRefreshed event, Emitter<BookingState> emit) async {
    final reference = state.reference;
    if (reference != null) await _load(reference, emit, quiet: true);
  }

  Future<void> _load(String reference, Emitter<BookingState> emit, {bool quiet = false}) async {
    if (!quiet) emit(state.copyWith(viewState: ViewState.processing, reference: reference.toUpperCase()));
    final result = await _get(reference);
    result.fold(
      (failure) => emit(state.copyWith(viewState: ViewState.error, errorMessage: failure.message)),
      (booking) => emit(state.copyWith(viewState: ViewState.success, booking: booking, errorMessage: null)),
    );
  }
}

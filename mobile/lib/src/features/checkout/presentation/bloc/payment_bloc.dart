import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/link_service.dart';
import '../../../../services/payment_sheet_service.dart';
import '../../../booking/data/models/public_booking_model.dart';
import '../../../booking/domain/usecases/booking_actions_use_cases.dart';
import '../../../booking/domain/usecases/get_booking_use_case.dart';
import '../../../search/data/models/public_models.dart';
import '../../../search/domain/usecases/public_use_cases.dart';
import '../../domain/booking_draft.dart';

part 'payment_bloc.freezed.dart';

/// Where the payment step stands.
enum PaymentStatus {
  loading,

  /// Recap, countdown and "Payer".
  ready,

  /// The payment sheet is open (or being prepared).
  presenting,

  /// Web builds: off to Stripe Checkout.
  redirecting,

  /// Paid on Stripe's side, the API confirms (webhook or read): polling.
  verifying,

  /// Confirmed: the confirmation screen opens.
  paid,

  /// The hold ended: nothing was charged, "Recommencer".
  expired,

  /// "Modifier" / "Recommencer": the place is released, the form opens again.
  released,

  /// The booking could not be read.
  error,
}

/// A notice under the button after the sheet closed.
enum PaymentNotice { canceled, failed }

sealed class PaymentEvent {
  const PaymentEvent();
}

class PaymentStarted extends PaymentEvent {
  const PaymentStarted();
}

class PaymentTicked extends PaymentEvent {
  const PaymentTicked();
}

class PaymentPayPressed extends PaymentEvent {
  const PaymentPayPressed();
}

/// "Actualiser" while verifying, or the countdown reached zero.
class PaymentRefreshRequested extends PaymentEvent {
  const PaymentRefreshRequested();
}

/// "Modifier" (or "Recommencer" once the hold expired).
class PaymentEditPressed extends PaymentEvent {
  const PaymentEditPressed();
}

@freezed
abstract class PaymentState with _$PaymentState {
  const PaymentState._();

  const factory PaymentState({
    required String reference,
    @Default(PaymentStatus.loading) PaymentStatus status,
    PublicBookingModel? booking,
    PaymentsConfigModel? config,
    /// Seconds left on the hold, counted down from the API's figure (never the phone's clock).
    int? secondsLeft,
    PaymentNotice? notice,
    /// Stripe's message of a failed attempt, or the translated API error.
    String? message,
    @Default(false) bool busy,
  }) = _PaymentState;

  /// The native sheet can be used (else: Checkout, on web builds).
  bool sheetAvailable(PaymentSheetService sheet) => sheet.supported && (config?.publishableKey?.isNotEmpty ?? false);
}

/// A4, step 2 "Paiement": the state machine of a booking holding its place while it is paid.
/// The native payment sheet (card, Apple Pay, Google Pay) confirms a PaymentIntent created by the
/// API; web builds go to Stripe Checkout instead. The API confirms the booking (webhook, or when
/// the booking is read): the app only polls until it says "upcoming".
class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {
  PaymentBloc(
    this._getBooking,
    this._config,
    this._intent,
    this._checkout,
    this._release,
    this._sheet,
    this._links,
    this._drafts, {
    required String reference,
    this.pollInterval = const Duration(seconds: 2),
    this.pollAttempts = 10,
    this.tick = const Duration(seconds: 1),
  }) : super(PaymentState(reference: reference.toUpperCase())) {
    on<PaymentStarted>(_onStarted);
    on<PaymentTicked>(_onTicked);
    on<PaymentPayPressed>(_onPay);
    on<PaymentRefreshRequested>(_onRefresh);
    on<PaymentEditPressed>(_onEdit);
  }

  final GetBookingUseCase _getBooking;
  final GetPaymentsConfigUseCase _config;
  final CreatePaymentIntentUseCase _intent;
  final CheckoutUseCase _checkout;
  final ReleaseHoldUseCase _release;
  final PaymentSheetService _sheet;
  final LinkService _links;
  final BookingDraftStore _drafts;
  final Duration pollInterval;
  final int pollAttempts;
  final Duration tick;
  Timer? _timer;

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }

  Future<void> _onStarted(PaymentStarted event, Emitter<PaymentState> emit) async {
    emit(state.copyWith(status: PaymentStatus.loading));
    final results = await Future.wait([_getBooking(state.reference), _config(NoParams())]);
    final config = results[1].fold((_) => null, (c) => c as PaymentsConfigModel);
    results[0].fold(
      (f) => emit(state.copyWith(status: PaymentStatus.error, message: f.message, config: config)),
      (b) => _applyBooking(b as PublicBookingModel, emit, config: config),
    );
  }

  /// Where a booking read from the API puts the payment step.
  void _applyBooking(PublicBookingModel b, Emitter<PaymentState> emit, {PaymentsConfigModel? config}) {
    final status = switch (b) {
      _ when b.status == 'pending_payment' => PaymentStatus.ready,
      _ when b.holdExpired => PaymentStatus.expired,
      // Paid (or paid at the parking, or closed otherwise): nothing to pay here.
      _ => PaymentStatus.paid,
    };
    if (status == PaymentStatus.paid) _drafts.clear();
    emit(state.copyWith(status: status, booking: b, config: config ?? state.config, secondsLeft: b.payment?.holdSecondsLeft, busy: false));
    _timer?.cancel();
    if (status == PaymentStatus.ready && b.payment?.holdSecondsLeft != null) {
      _timer = Timer.periodic(tick, (_) => add(const PaymentTicked()));
    }
  }

  Future<void> _onTicked(PaymentTicked event, Emitter<PaymentState> emit) async {
    final left = state.secondsLeft;
    if (left == null || state.status != PaymentStatus.ready) return;
    if (left > 1) {
      emit(state.copyWith(secondsLeft: left - 1));
      return;
    }
    // Over: the API then reads the hold as expired.
    _timer?.cancel();
    emit(state.copyWith(secondsLeft: 0));
    await _reload(emit);
  }

  Future<void> _reload(Emitter<PaymentState> emit) async {
    final result = await _getBooking(state.reference);
    result.fold((f) => emit(state.copyWith(message: f.message)), (b) => _applyBooking(b, emit));
  }

  Future<void> _onPay(PaymentPayPressed event, Emitter<PaymentState> emit) async {
    if (state.status != PaymentStatus.ready || state.busy) return;
    emit(state.copyWith(notice: null, message: null, busy: true));
    if (state.sheetAvailable(_sheet)) {
      await _paySheet(emit);
    } else {
      await _payCheckout(emit);
    }
  }

  Future<void> _paySheet(Emitter<PaymentState> emit) async {
    emit(state.copyWith(status: PaymentStatus.presenting));
    final result = await _intent(state.reference);
    if (result.isLeft) return _failed(result.fold((f) => f, (_) => throw StateError('')), emit);
    final intent = result.fold((_) => throw StateError(''), (i) => i);
    if (intent.paid || intent.clientSecret == null) return _verify(emit);
    final config = state.config!;
    final outcome = await _sheet.present(
      publishableKey: config.publishableKey!,
      clientSecret: intent.clientSecret!,
      merchantDisplayName: config.merchantDisplayName,
      merchantCountryCode: config.merchantCountryCode,
      currency: config.currency,
      amountLabel: intent.amountCents == null ? null : formatEuros(intent.amountCents!),
    );
    switch (outcome.result) {
      case PaymentSheetResult.completed:
        await _verify(emit);
      case PaymentSheetResult.canceled:
        emit(state.copyWith(status: PaymentStatus.ready, notice: PaymentNotice.canceled, busy: false));
      case PaymentSheetResult.failed:
        emit(state.copyWith(status: PaymentStatus.ready, notice: PaymentNotice.failed, message: outcome.message, busy: false));
    }
  }

  Future<void> _payCheckout(Emitter<PaymentState> emit) async {
    emit(state.copyWith(status: PaymentStatus.redirecting));
    final result = await _checkout(state.reference);
    if (result.isLeft) return _failed(result.fold((f) => f, (_) => throw StateError('')), emit);
    final checkout = result.fold((_) => throw StateError(''), (c) => c);
    if (checkout.paid || checkout.url == null) return _verify(emit);
    final opened = await _links.redirect(Uri.parse(checkout.url!));
    if (!opened) emit(state.copyWith(status: PaymentStatus.ready, busy: false, message: 'link_failed'));
  }

  Future<void> _failed(Failure failure, Emitter<PaymentState> emit) async {
    if (failure.code == 'hold_expired') {
      // The hold ended meanwhile: the step says so (the API reads it as expired).
      await _reload(emit);
      if (state.status != PaymentStatus.expired) emit(state.copyWith(status: PaymentStatus.expired, busy: false));
      return;
    }
    emit(state.copyWith(status: PaymentStatus.ready, busy: false, message: failure.message));
  }

  /// Polls the booking until the API confirms it (it asks Stripe on every read).
  Future<void> _verify(Emitter<PaymentState> emit) async {
    _timer?.cancel();
    emit(state.copyWith(status: PaymentStatus.verifying, busy: false, notice: null));
    for (var i = 0; i < pollAttempts; i++) {
      final result = await _getBooking(state.reference);
      final booking = result.fold((_) => null, (b) => b);
      if (booking != null && booking.status != 'pending_payment') {
        _applyBooking(booking, emit);
        return;
      }
      if (i < pollAttempts - 1) await Future<void>.delayed(pollInterval);
    }
    // Still not confirmed: "Actualiser" stays on screen.
  }

  Future<void> _onRefresh(PaymentRefreshRequested event, Emitter<PaymentState> emit) async {
    if (state.status == PaymentStatus.verifying) return _verify(emit);
    await _reload(emit);
  }

  Future<void> _onEdit(PaymentEditPressed event, Emitter<PaymentState> emit) async {
    if (state.busy) return;
    emit(state.copyWith(busy: true, message: null, notice: null));
    final result = await _release(state.reference);
    result.fold(
      (f) {
        // Paid in the meantime: nothing to edit, the booking is confirmed.
        if (f.code == 'already_paid') {
          add(const PaymentRefreshRequested());
          emit(state.copyWith(status: PaymentStatus.verifying, busy: false));
        } else {
          emit(state.copyWith(busy: false, message: f.message));
        }
      },
      (b) {
        _timer?.cancel();
        emit(state.copyWith(status: PaymentStatus.released, booking: b, busy: false));
      },
    );
  }
}

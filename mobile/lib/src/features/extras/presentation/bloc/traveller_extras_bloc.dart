import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/payment_sheet_service.dart';
import '../../../search/domain/usecases/public_use_cases.dart';
import '../../data/models/extras_models.dart';
import '../../domain/usecases/extras_use_cases.dart';

part 'traveller_extras_bloc.freezed.dart';

sealed class TravellerExtrasEvent {
  const TravellerExtrasEvent();
}

class TravellerExtrasStarted extends TravellerExtrasEvent {
  const TravellerExtrasStarted(this.reference);
  final String reference;
}

/// « Payer » on the recap sheet: the order, Stripe's payment sheet, then the payment read back.
class TravellerExtraOrdered extends TravellerExtrasEvent {
  const TravellerExtraOrdered(this.kind);
  final String kind;
}

class TravellerExtrasNoticeShown extends TravellerExtrasEvent {
  const TravellerExtrasNoticeShown();
}

@freezed
abstract class TravellerExtrasState with _$TravellerExtrasState {
  const TravellerExtrasState._();

  const factory TravellerExtrasState({
    String? reference,
    TravellerExtrasModel? data,

    /// The service being ordered (its button spins).
    String? busyKind,

    /// What just happened, for a snackbar: ordered, canceled, failed; or an API code in [errorCode].
    String? notice,
    String? errorCode,
    String? message,
  }) = _TravellerExtrasState;

  bool get busy => busyKind != null;
}

/// « Services pour votre voiture » on « Ma réservation » (21/10/2026, direction A): order a wash or a charge, before or
/// after the drop-off, paid in the native payment sheet.
class TravellerExtrasBloc extends Bloc<TravellerExtrasEvent, TravellerExtrasState> {
  TravellerExtrasBloc(this._extras, this._config, this._sheet) : super(const TravellerExtrasState()) {
    on<TravellerExtrasStarted>(_onStarted);
    on<TravellerExtraOrdered>(_onOrdered);
    on<TravellerExtrasNoticeShown>((e, emit) => emit(state.copyWith(notice: null, errorCode: null, message: null)));
  }

  final TravellerExtrasUseCases _extras;
  final GetPaymentsConfigUseCase _config;
  final PaymentSheetService _sheet;

  Future<void> _onStarted(TravellerExtrasStarted event, Emitter<TravellerExtrasState> emit) async {
    emit(state.copyWith(reference: event.reference));
    final result = await _extras.load(event.reference);
    result.fold((_) {}, (data) => emit(state.copyWith(data: data)));
  }

  void _fail(Emitter<TravellerExtrasState> emit, Failure f) =>
      emit(state.copyWith(busyKind: null, errorCode: f.code ?? 'generic', message: f.message));

  Future<void> _onOrdered(TravellerExtraOrdered event, Emitter<TravellerExtrasState> emit) async {
    final reference = state.reference;
    if (reference == null || state.busy) return;
    emit(state.copyWith(busyKind: event.kind, notice: null, errorCode: null, message: null));
    final config = (await _config(NoParams())).fold((_) => null, (c) => c);
    if (!_sheet.supported || (config?.publishableKey?.isEmpty ?? true)) {
      emit(state.copyWith(busyKind: null, errorCode: 'online_booking_unavailable'));
      return;
    }
    final ordered = await _extras.order(reference, event.kind);
    if (ordered.isLeft) return _fail(emit, ordered.fold((f) => f, (_) => throw StateError('')));
    final response = ordered.fold((_) => throw StateError(''), (r) => r);
    final extraId = response.extra.id;
    final payment = response.payment;
    if (payment.paid || payment.clientSecret == null) return _sync(emit, reference, extraId);
    final outcome = await _sheet.present(
      publishableKey: config!.publishableKey!,
      clientSecret: payment.clientSecret!,
      merchantDisplayName: config.merchantDisplayName,
      merchantCountryCode: config.merchantCountryCode,
      currency: config.currency,
      amountLabel: payment.amountCents == null ? null : formatEuros(payment.amountCents!),
    );
    switch (outcome.result) {
      case PaymentSheetResult.completed:
        await _sync(emit, reference, extraId);
      case PaymentSheetResult.canceled:
      case PaymentSheetResult.failed:
        final closed = await _extras.abandon(reference, extraId);
        emit(
          state.copyWith(
            data: closed.fold((_) => state.data, (d) => d),
            busyKind: null,
            notice: outcome.result == PaymentSheetResult.canceled ? 'canceled' : 'failed',
            message: outcome.message,
          ),
        );
    }
  }

  Future<void> _sync(Emitter<TravellerExtrasState> emit, String reference, String extraId) async {
    final result = await _extras.sync(reference, extraId);
    result.fold((f) => _fail(emit, f), (data) {
      final paid = data.orders.any((o) => o.id == extraId && o.status != 'expired');
      emit(state.copyWith(data: data, busyKind: null, notice: paid ? 'ordered' : 'pending'));
    });
  }
}

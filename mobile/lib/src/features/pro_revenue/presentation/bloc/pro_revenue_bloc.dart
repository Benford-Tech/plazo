import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/utils/clock.dart';
import '../../data/models/revenue_models.dart';
import '../../domain/revenue_period.dart';
import '../../domain/usecases/revenue_use_cases.dart';

part 'pro_revenue_bloc.freezed.dart';

sealed class ProRevenueEvent {
  const ProRevenueEvent();
}

class ProRevenueStarted extends ProRevenueEvent {
  const ProRevenueStarted();
}

class ProRevenueSpanChanged extends ProRevenueEvent {
  const ProRevenueSpanChanged(this.span);
  final RevenueSpan span;
}

/// ‹ (-1) and › (+1).
class ProRevenueStepped extends ProRevenueEvent {
  const ProRevenueStepped(this.delta);
  final int delta;
}

/// `arrival` (the day the car comes) or `booked` (the day the booking was taken).
class ProRevenueBasisChanged extends ProRevenueEvent {
  const ProRevenueBasisChanged(this.basis);
  final String basis;
}

class ProRevenueRefreshed extends ProRevenueEvent {
  const ProRevenueRefreshed();
}

/// The amount typed for a booking of « À compléter », as the staff typed it (« 45,50 »).
class ProRevenuePriceSubmitted extends ProRevenueEvent {
  const ProRevenuePriceSubmitted({required this.id, required this.text});
  final String id;
  final String text;
}

/// Why an amount was not saved: `invalid` (typed), `price_locked` (paid on Plazo), `reservation_closed` (cancelled
/// meanwhile), `not_found`, or `failed` with the translated [message].
typedef RevenueRowError = ({String code, String? message});

@freezed
abstract class ProRevenueState with _$ProRevenueState {
  const ProRevenueState._();

  const factory ProRevenueState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(RevenueSpan.month) RevenueSpan span,

    /// A local date inside the period shown.
    required String anchor,

    /// The parking's today: the phone's until the server says it.
    required String today,
    @Default('arrival') String basis,

    /// The report of the period shown; null while another period loads.
    RevenueReportModel? report,
    String? errorMessage,

    /// The manager moved away from the opening period: the server's today no longer re-anchors it.
    @Default(false) bool moved,
    @Default(<String>{}) Set<String> saving,
    @Default(<String, RevenueRowError>{}) Map<String, RevenueRowError> rowErrors,

    /// The last amount saved, for « Montant enregistré : … ».
    String? savedName,
    int? savedCents,
  }) = _ProRevenueState;

  ({String from, String to}) get period => revenuePeriod(span, anchor);
}

/// P-B (13/10/2026): the revenue page of Plazo Pro (« Jour · Semaine · Mois », ‹ ›, by arrival or booking day) and
/// its « À compléter » screen, which adds the amount of a booking that has none (PUT /internal/reservations/:id/price).
class ProRevenueBloc extends Bloc<ProRevenueEvent, ProRevenueState> {
  ProRevenueBloc(this._report, this._setPrice, {Clock clock = systemClock}) : super(ProRevenueState(anchor: isoDay(clock()), today: isoDay(clock()))) {
    on<ProRevenueStarted>((e, emit) => _load(emit));
    on<ProRevenueRefreshed>((e, emit) => _load(emit, quiet: true));
    on<ProRevenueSpanChanged>(_onSpan);
    on<ProRevenueStepped>(_onStepped);
    on<ProRevenueBasisChanged>(_onBasis);
    on<ProRevenuePriceSubmitted>(_onPrice);
  }

  final GetRevenueReportUseCase _report;
  final SetReservationPriceUseCase _setPrice;

  /// Numbers the reads: only the latest one started is applied (a quiet read after a save may overtake another).
  int _readSeq = 0;

  Future<void> _onSpan(ProRevenueSpanChanged e, Emitter<ProRevenueState> emit) async {
    if (e.span == state.span) return;
    final anchor = anchorForSpan(from: state.span, anchor: state.anchor, today: state.today);
    emit(state.copyWith(span: e.span, anchor: anchor, moved: true, report: null, savedName: null, savedCents: null, rowErrors: const {}));
    await _load(emit);
  }

  Future<void> _onStepped(ProRevenueStepped e, Emitter<ProRevenueState> emit) async {
    emit(
      state.copyWith(anchor: stepAnchor(state.span, state.anchor, e.delta), moved: true, report: null, savedName: null, savedCents: null, rowErrors: const {}),
    );
    await _load(emit);
  }

  Future<void> _onBasis(ProRevenueBasisChanged e, Emitter<ProRevenueState> emit) async {
    if (e.basis == state.basis) return;
    emit(state.copyWith(basis: e.basis, report: null, savedName: null, savedCents: null, rowErrors: const {}));
    await _load(emit);
  }

  /// Reads the period shown. A quiet read (refresh, after an amount) keeps the figures on screen meanwhile and on
  /// failure; an answer overtaken by a later read, or for a period the manager already left, is dropped.
  Future<void> _load(Emitter<ProRevenueState> emit, {bool quiet = false}) async {
    final seq = ++_readSeq;
    final key = (state.span, state.anchor, state.basis);
    final period = state.period;
    if (!quiet || state.report == null) emit(state.copyWith(viewState: ViewState.processing, errorMessage: null));
    final result = await _report(RevenueReportParams(from: period.from, to: period.to, basis: state.basis));
    if (seq != _readSeq || (state.span, state.anchor, state.basis) != key) return;
    await result.fold(
      (failure) async => emit(state.copyWith(viewState: state.report == null ? ViewState.error : ViewState.success, errorMessage: failure.message)),
      (report) async {
        final today = report.today ?? state.today;
        // The phone's date is not the parking's (wrong clock, other time zone): open on the parking's period.
        if (!state.moved && today != state.today && !holds(period, today)) {
          // The figures shown are another period's: away with them, the next read shows its own (or its error).
          emit(state.copyWith(today: today, anchor: today, report: null));
          return _load(emit);
        }
        emit(state.copyWith(viewState: ViewState.success, report: report, today: today, errorMessage: null));
      },
    );
  }

  Future<void> _onPrice(ProRevenuePriceSubmitted e, Emitter<ProRevenueState> emit) async {
    if (state.saving.contains(e.id)) return;
    final parsed = parseEuroInput(e.text);
    final cents = parsed.cents;
    if (!parsed.valid || cents == null) {
      emit(state.copyWith(rowErrors: {...state.rowErrors, e.id: (code: 'invalid', message: null)}));
      return;
    }
    final booking = state.report?.missing.where((m) => m.id == e.id).firstOrNull;
    final key = (state.span, state.anchor, state.basis);
    emit(state.copyWith(saving: {...state.saving, e.id}, rowErrors: {...state.rowErrors}..remove(e.id), savedName: null, savedCents: null));
    final result = await _setPrice(SetReservationPriceParams(id: e.id, priceCents: cents));
    final saving = {...state.saving}..remove(e.id);
    // The manager left for another period meanwhile: its own read is already under way.
    final samePeriod = (state.span, state.anchor, state.basis) == key;
    await result.fold(
      (failure) async {
        final code = failure.fields?['priceCents'] ?? failure.code;
        final known = const {'price_locked', 'reservation_closed', 'not_found'}.contains(code);
        if (!samePeriod) return emit(state.copyWith(saving: saving));
        emit(state.copyWith(saving: saving, rowErrors: {...state.rowErrors, e.id: (code: known ? code! : 'failed', message: failure.message)}));
      },
      (_) async {
        final report = state.report;
        if (!samePeriod) return emit(state.copyWith(saving: saving));
        final listed = report?.missing.any((m) => m.id == e.id) ?? false;
        emit(
          state.copyWith(
            saving: saving,
            savedName: booking == null ? null : (booking.customerName.trim().isEmpty ? booking.reference : booking.customerName),
            savedCents: cents,
            // The row leaves the list at once; the figures follow with the next read.
            report: !listed
                ? report
                : report!.copyWith(
                    missing: report.missing.where((m) => m.id != e.id).toList(),
                    withoutAmount: report.withoutAmount > 0 ? report.withoutAmount - 1 : 0,
                  ),
          ),
        );
        await _load(emit, quiet: true);
      },
    );
  }
}

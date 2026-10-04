import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../data/models/reservation_models.dart';
import '../../domain/usecases/reservations_use_cases.dart';

part 'pro_reservations_bloc.freezed.dart';

sealed class ProReservationsEvent {
  const ProReservationsEvent();
}

class ProReservationsStarted extends ProReservationsEvent {
  const ProReservationsStarted();
}

class ProReservationsSearched extends ProReservationsEvent {
  const ProReservationsSearched(this.query);
  final String query;
}

class ProReservationsMoreRequested extends ProReservationsEvent {
  const ProReservationsMoreRequested();
}

class ProReservationsRefreshed extends ProReservationsEvent {
  const ProReservationsRefreshed();
}

/// A booking changed elsewhere (detail, form): the list row follows.
class ProReservationsUpdated extends ProReservationsEvent {
  const ProReservationsUpdated(this.reservation);
  final ReservationModel reservation;
}

@freezed
abstract class ProReservationsState with _$ProReservationsState {
  const factory ProReservationsState({
    @Default(ViewState.idle) ViewState viewState,
    @Default('') String query,
    @Default([]) List<ReservationModel> items,
    @Default(0) int total,
    @Default(1) int page,
    @Default(false) bool hasMore,
    @Default(false) bool loadingMore,
    String? errorCode,
  }) = _ProReservationsState;
}

/// The staff's bookings: search by plate, name, phone or reference, most recent arrivals first.
class ProReservationsBloc extends Bloc<ProReservationsEvent, ProReservationsState> {
  ProReservationsBloc(this._list) : super(const ProReservationsState()) {
    on<ProReservationsStarted>((e, emit) => _load(emit, query: state.query));
    on<ProReservationsRefreshed>((e, emit) => _load(emit, query: state.query));
    on<ProReservationsSearched>(_onSearched);
    on<ProReservationsMoreRequested>(_onMore);
    on<ProReservationsUpdated>((e, emit) {
      final has = state.items.any((r) => r.id == e.reservation.id);
      emit(state.copyWith(items: has ? state.items.map((r) => r.id == e.reservation.id ? e.reservation : r).toList() : [e.reservation, ...state.items]));
    });
  }

  final ListReservationsUseCase _list;

  static String _code(Failure f) => f.code ?? (f.statusCode == null ? 'network' : 'generic');

  Future<void> _onSearched(ProReservationsSearched event, Emitter<ProReservationsState> emit) async {
    emit(state.copyWith(query: event.query));
    await _load(emit, query: event.query);
  }

  Future<void> _load(Emitter<ProReservationsState> emit, {required String query}) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null));
    final result = await _list(ListReservationsParams(query: query.trim().isEmpty ? null : query.trim(), page: 1));
    if (state.query != query) return; // a newer search is running
    result.fold(
      (f) => emit(state.copyWith(viewState: ViewState.error, errorCode: _code(f))),
      (page) => emit(state.copyWith(viewState: ViewState.success, items: page.docs, total: page.totalDocs, page: 1, hasMore: page.hasNextPage)),
    );
  }

  Future<void> _onMore(ProReservationsMoreRequested event, Emitter<ProReservationsState> emit) async {
    if (!state.hasMore || state.loadingMore) return;
    emit(state.copyWith(loadingMore: true));
    final q = state.query;
    final result = await _list(ListReservationsParams(query: q.trim().isEmpty ? null : q.trim(), page: state.page + 1));
    if (state.query != q) return;
    result.fold(
      (f) => emit(state.copyWith(loadingMore: false, errorCode: _code(f))),
      (page) =>
          emit(state.copyWith(loadingMore: false, items: [...state.items, ...page.docs], page: page.page, hasMore: page.hasNextPage, total: page.totalDocs)),
    );
  }
}

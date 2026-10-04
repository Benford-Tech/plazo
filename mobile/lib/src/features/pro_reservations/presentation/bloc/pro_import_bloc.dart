import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/error/failure.dart';
import '../../data/models/reservation_models.dart';
import '../../domain/usecases/reservations_use_cases.dart';

part 'pro_import_bloc.freezed.dart';

sealed class ProImportEvent {
  const ProImportEvent();
}

class ProImportParsed extends ProImportEvent {
  const ProImportParsed(this.text);
  final String text;
}

class ProImportReset extends ProImportEvent {
  const ProImportReset();
}

@freezed
abstract class ProImportState with _$ProImportState {
  const ProImportState._();

  const factory ProImportState({@Default(ViewState.idle) ViewState viewState, ParsedEmailModel? result, String? errorCode}) = _ProImportState;

  /// The form's values from what the importer read.
  ReservationInput? get input {
    final p = result?.parsed;
    if (p == null) return null;
    return ReservationInput(
      channel: 'aggregator',
      channelDetail: p.provider,
      arrivalAt: p.arrivalAt ?? '',
      returnAt: p.returnAt ?? '',
      passengers: p.passengers ?? 2,
      customerName: p.customerName ?? '',
      customerPhone: p.customerPhone ?? '',
      customerEmail: p.customerEmail,
      plate: p.plate ?? '',
      returnFlight: p.returnFlight,
      externalReference: p.externalReference,
      priceCents: p.priceCents,
    );
  }
}

/// A confirmation email pasted by the staff: what the importer read, what is missing, a duplicate.
class ProImportBloc extends Bloc<ProImportEvent, ProImportState> {
  ProImportBloc(this._parse) : super(const ProImportState()) {
    on<ProImportParsed>(_onParsed);
    on<ProImportReset>((e, emit) => emit(const ProImportState()));
  }

  final ParseEmailUseCase _parse;

  Future<void> _onParsed(ProImportParsed event, Emitter<ProImportState> emit) async {
    emit(state.copyWith(viewState: ViewState.processing, errorCode: null, result: null));
    final result = await _parse(event.text);
    result.fold(
      (Failure f) => emit(state.copyWith(viewState: ViewState.error, errorCode: f.code ?? (f.statusCode == null ? 'network' : 'generic'))),
      (r) => emit(state.copyWith(viewState: ViewState.success, result: r)),
    );
  }
}

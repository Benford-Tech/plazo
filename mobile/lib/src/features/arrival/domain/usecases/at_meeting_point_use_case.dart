import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../data/models/arrival_model.dart';
import '../repositories/arrival_repository.dart';

class AtMeetingPointParams extends Equatable {
  const AtMeetingPointParams({required this.reference, required this.kind, this.position, this.note});
  final String reference;
  final ArrivalKind kind;
  final GeoPosition? position;
  final String? note;
  @override
  List<Object?> get props => [reference, kind, position, note];
}

/// "Je suis au point de rendez-vous" (optionally with a one-off position).
class AtMeetingPointUseCase with UseCase<ArrivalModel, AtMeetingPointParams> {
  AtMeetingPointUseCase(this._repository);

  final ArrivalRepository _repository;

  @override
  Future<Either<Failure, ArrivalModel>> call(AtMeetingPointParams params) => _repository.atMeetingPoint(params.reference, params.kind, params.position, note: params.note);
}

import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/arrival_model.dart';
import '../repositories/arrival_repository.dart';

class AnnounceParams extends Equatable {
  const AnnounceParams({required this.reference, required this.kind, required this.minutes, this.note});
  final String reference;
  final ArrivalKind kind;
  final int minutes;
  final String? note;
  @override
  List<Object?> get props => [reference, kind, minutes, note];
}

/// "J'arrive dans 10 / 20 / 30 min", without sharing the position.
class AnnounceArrivalUseCase with UseCase<ArrivalModel, AnnounceParams> {
  AnnounceArrivalUseCase(this._repository);

  final ArrivalRepository _repository;

  @override
  Future<Either<Failure, ArrivalModel>> call(AnnounceParams params) => _repository.announce(params.reference, params.kind, params.minutes, note: params.note);
}

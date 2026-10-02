import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/arrival_model.dart';
import '../repositories/arrival_repository.dart';

class StopSharingParams extends Equatable {
  const StopSharingParams({required this.reference, this.kind});
  final String reference;
  final ArrivalKind? kind;
  @override
  List<Object?> get props => [reference, kind];
}

/// Stops sharing: the server erases the position at once.
class StopSharingUseCase with UseCase<ArrivalModel, StopSharingParams> {
  StopSharingUseCase(this._repository);

  final ArrivalRepository _repository;

  @override
  Future<Either<Failure, ArrivalModel>> call(StopSharingParams params) => _repository.stop(params.reference, params.kind);
}

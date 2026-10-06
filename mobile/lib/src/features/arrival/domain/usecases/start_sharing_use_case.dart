import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/arrival_model.dart';
import '../repositories/arrival_repository.dart';

class StartSharingParams extends Equatable {
  const StartSharingParams({required this.reference, required this.kind, this.note});
  final String reference;
  final ArrivalKind kind;

  /// E (06/10/2026): a word for the parking, sent with the signal.
  final String? note;
  @override
  List<Object?> get props => [reference, kind, note];
}

/// Starts sharing the live position (the traveller consented by tapping the button).
class StartSharingUseCase with UseCase<ArrivalModel, StartSharingParams> {
  StartSharingUseCase(this._repository);

  final ArrivalRepository _repository;

  @override
  Future<Either<Failure, ArrivalModel>> call(StartSharingParams params) => _repository.start(params.reference, params.kind, note: params.note);
}

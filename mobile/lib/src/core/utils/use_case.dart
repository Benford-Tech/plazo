import 'package:equatable/equatable.dart';

import '../error/failure.dart';
import 'either.dart';

mixin UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

///
/// No params if the data object is in local cache
///
class NoParams extends Equatable {
  @override
  List<Object> get props => [];
}

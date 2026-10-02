abstract class Either<L, R> {
  const Either();
  T fold<T>(T Function(L left) ifLeft, T Function(R right) ifRight) {
    if (this is Left<L, R>) {
      return ifLeft((this as Left<L, R>).value);
    } else if (this is Right<L, R>) {
      return ifRight((this as Right<L, R>).value);
    }
    throw Exception('unknown Either type');
  }

  bool get isLeft => this is Left<L, R>;
  bool get isRight => this is Right<L, R>;
}

class Left<L, R> extends Either<L, R> {
  const Left(this.value);
  final L value;
}

class Right<L, R> extends Either<L, R> {
  const Right(this.value);
  final R value;
}

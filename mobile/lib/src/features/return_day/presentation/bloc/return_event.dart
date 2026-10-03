part of 'return_bloc.dart';

sealed class ReturnEvent {
  const ReturnEvent();
}

class ReturnOpened extends ReturnEvent {
  const ReturnOpened(this.reference);
  final String reference;
}

class ReturnRefreshRequested extends ReturnEvent {
  const ReturnRefreshRequested();
}

/// "J'ai atterri" (when no flight data tells it).
class ReturnLandedDeclared extends ReturnEvent {
  const ReturnLandedDeclared();
}

class ReturnTicked extends ReturnEvent {
  const ReturnTicked();
}

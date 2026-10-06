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

/// E (06/10/2026): "Mon vol a du retard", "Bagage perdu", or a word for the parking.
class ReturnNoticeSent extends ReturnEvent {
  const ReturnNoticeSent(this.kind, {this.text});
  final String kind;
  final String? text;
}

class ReturnTicked extends ReturnEvent {
  const ReturnTicked();
}

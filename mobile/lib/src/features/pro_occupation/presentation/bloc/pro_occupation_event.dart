part of 'pro_occupation_bloc.dart';

sealed class ProOccupationEvent {
  const ProOccupationEvent();
}

class ProOccupationStarted extends ProOccupationEvent {
  /// `focus`: the reservation whose vehicle card opens at once (C-B, 06/10/2026: "Placer la voiture" from the sheet).
  const ProOccupationStarted({this.focus});
  final String? focus;
}

class ProOccupationRefreshed extends ProOccupationEvent {
  const ProOccupationRefreshed();
}

class ProOccupationSearched extends ProOccupationEvent {
  const ProOccupationSearched(this.query);
  final String query;
}

class ProOccupationVehicleChosen extends ProOccupationEvent {
  const ProOccupationVehicleChosen(this.vehicle);
  final OccupantModel? vehicle;
}

/// Puts the booking on a spot (null: releases it); with the key hook when given.
class ProOccupationPlaced extends ProOccupationEvent {
  const ProOccupationPlaced({required this.reservationId, required this.spotId, this.keyHook});
  final String reservationId;
  final String? spotId;
  final String? keyHook;
}

class ProOccupationKeysSaved extends ProOccupationEvent {
  const ProOccupationKeysSaved({required this.reservationId, required this.keyHook});
  final String reservationId;
  final String? keyHook;
}

class ProOccupationErrorDismissed extends ProOccupationEvent {
  const ProOccupationErrorDismissed();
}

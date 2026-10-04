part of 'pro_plan_bloc.dart';

sealed class ProPlanEvent {
  const ProPlanEvent();
}

class ProPlanStarted extends ProPlanEvent {
  const ProPlanStarted();
}

class ProPlanAddressSearched extends ProPlanEvent {
  const ProPlanAddressSearched(this.query);
  final String query;
}

class ProPlanResultChosen extends ProPlanEvent {
  const ProPlanResultChosen(this.result);
  final GeocodeResultModel result;
}

class ProPlanGeolocateRequested extends ProPlanEvent {
  const ProPlanGeolocateRequested();
}

class ProPlanMapMoved extends ProPlanEvent {
  const ProPlanMapMoved(this.center);
  final LatLng center;
}

class ProPlanStepChanged extends ProPlanEvent {
  const ProPlanStepChanged(this.step);
  final PlanStep step;
}

class ProPlanCornerAdded extends ProPlanEvent {
  const ProPlanCornerAdded(this.point);
  final LatLng point;
}

/// A long press near a corner moves it there.
class ProPlanCornerMoved extends ProPlanEvent {
  const ProPlanCornerMoved(this.index, this.point);
  final int index;
  final LatLng point;
}

class ProPlanCornerRemoved extends ProPlanEvent {
  const ProPlanCornerRemoved(this.index);
  final int index;
}

class ProPlanLastCornerUndone extends ProPlanEvent {
  const ProPlanLastCornerUndone();
}

class ProPlanRectangleRequested extends ProPlanEvent {
  const ProPlanRectangleRequested();
}

class ProPlanCornersCleared extends ProPlanEvent {
  const ProPlanCornersCleared();
}

/// Saves the outline (and the single zone) and asks the server for the three layouts.
class ProPlanOutlineValidated extends ProPlanEvent {
  const ProPlanOutlineValidated();
}

class ProPlanLayoutChosen extends ProPlanEvent {
  const ProPlanLayoutChosen(this.layout);
  final String layout;
}

class ProPlanGenerateRequested extends ProPlanEvent {
  const ProPlanGenerateRequested();
}

class ProPlanErrorDismissed extends ProPlanEvent {
  const ProPlanErrorDismissed();
}

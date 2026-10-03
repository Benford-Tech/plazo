import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/pro_today/data/models/planning_model.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_today/data/models/staff_signal_model.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/services/location_service.dart';

final t0 = DateTime.utc(2026, 10, 3, 5, 40);

const reception = MeetingPointModel(lat: 45.73, lng: 5.05, source: 'parking');

ArrivalModel arrival({
  ArrivalKind kind = ArrivalKind.outbound,
  bool open = true,
  ArrivalSignalModel? signal,
  MeetingPointModel? meetingPoint = reception,
}) => ArrivalModel(
  reference: 'R7KQ2M',
  moment: ArrivalMomentModel(kind: kind, open: open, opensAt: t0.subtract(const Duration(hours: 1)), closesAt: t0.add(const Duration(hours: 3))),
  meetingPoint: meetingPoint,
  signal: signal,
);

ArrivalSignalModel signal({
  ArrivalSignalState state = ArrivalSignalState.sharing,
  ArrivalKind kind = ArrivalKind.outbound,
  int? etaMinutes,
  int? distanceM,
  int? announcedMinutes,
  DateTime? startedAt,
  String? endReason,
}) {
  final start = startedAt ?? t0;
  return ArrivalSignalModel(
    kind: kind,
    state: state,
    endReason: endReason,
    startedAt: start,
    expiresAt: start.add(const Duration(hours: 2)),
    secondsLeft: 7200,
    etaMinutes: etaMinutes,
    distanceM: distanceM,
    etaAt: etaMinutes == null ? null : t0.add(Duration(minutes: etaMinutes)),
    announcedMinutes: announcedMinutes,
  );
}

GeoPosition position(double lat, {DateTime? at}) => GeoPosition(lat: lat, lng: 5.05, accuracy: 10, recordedAt: at ?? t0);

PlanningRowModel row(String id, String name, String plate, DateTime at, {String status = 'upcoming'}) => PlanningRowModel(
  id: id,
  reference: 'R$id',
  status: status,
  arrivalAt: at,
  returnAt: at,
  passengers: 2,
  customerName: name,
  plate: plate,
);

StaffSignalModel staffSignal(
  String reservationId, {
  String id = 's1',
  ArrivalKind kind = ArrivalKind.outbound,
  ArrivalSignalState state = ArrivalSignalState.sharing,
  int? etaMinutes = 12,
  int? announcedMinutes,
  String name = 'Camille Martin',
  String plate = 'AB-123-CD',
  bool withPosition = true,
}) => StaffSignalModel(
  id: id,
  reservationId: reservationId,
  reference: 'R$reservationId',
  kind: kind,
  state: state,
  customerName: name,
  plate: plate,
  passengers: 2,
  scheduledAt: t0,
  startedAt: t0,
  expiresAt: t0.add(const Duration(hours: 2)),
  distanceM: etaMinutes == null ? null : 8400,
  etaMinutes: etaMinutes,
  etaAt: etaMinutes == null ? null : t0.add(Duration(minutes: etaMinutes)),
  announcedMinutes: announcedMinutes,
  position: withPosition ? const SignalPositionModel(lat: 45.8, lng: 5.05, accuracyM: 10) : null,
  positionUpdatedAt: withPosition ? t0 : null,
  positionAgeSeconds: withPosition ? 20 : null,
  meetingPoint: reception,
);

const meetingT1 = MeetingPointModel(
  lat: 45.7205,
  lng: 5.0817,
  source: 'return_point',
  label: 'Terminal 1 · Porte 12',
  instructions: 'Sortez de la zone bagages, suivez « Sortie / Parkings ».\nPorte 12, traversez sur le passage piéton.',
  photoUrl: 'https://example.com/point.jpg',
);

/// The return day of a booking (GET /public/bookings/:reference/return).
TravellerReturnModel travellerReturn({
  FlightViewModel flight = const FlightViewModel(number: 'TO 3627', status: 'scheduled'),
  bool flightTracked = true,
  bool returnDay = true,
  DateTime? atMeetingPointAt,
  TravellerShuttleModel? shuttle,
  MeetingPointModel? meetingPoint = meetingT1,
}) => TravellerReturnModel(
  reference: 'R7KQ2M',
  status: 'arrived',
  returnAt: '2026-10-03T10:30',
  returnDay: returnDay,
  flight: flight,
  flightTracked: flightTracked,
  meetingPoint: meetingPoint,
  atMeetingPointAt: atMeetingPointAt,
  shuttle: shuttle,
  parking: const ReturnParkingModel(name: 'Parking Démo LYS', phone: '04 72 00 00 00', shuttleMinutes: 8),
  plate: 'AB-123-CD',
);

FlightViewModel landedFlight({String? number = 'TO 3627', String source = 'tracking'}) =>
    FlightViewModel(number: number, status: 'landed', landedAt: t0.subtract(const Duration(minutes: 5)), landedSource: source, terminal: '1', gate: '12');

TravellerShuttleModel travellerShuttle({int? etaMinutes = 4, bool withPosition = true}) => TravellerShuttleModel(
  tripId: 't1',
  startedAt: t0,
  vehicle: const TripVehicleModel(model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK'),
  driverFirstName: 'Karim',
  position: withPosition ? const ShuttlePositionModel(lat: 45.74, lng: 5.06) : null,
  positionAgeSeconds: withPosition ? 5 : null,
  distanceM: etaMinutes == null ? null : 2600,
  etaMinutes: etaMinutes,
  etaAt: etaMinutes == null ? null : t0.add(Duration(minutes: etaMinutes)),
  meetingPoint: meetingT1,
);

WalkingRouteModel walkingRoute({bool fallback = false}) => WalkingRouteModel(
  geometry: const [
    [45.722, 5.08],
    [45.7212, 5.081],
    [45.7205, 5.0817],
  ],
  distanceM: 450,
  durationMinutes: 6,
  fallback: fallback,
  from: const RoutePointModel(lat: 45.722, lng: 5.08),
  to: const RoutePointModel(lat: 45.7205, lng: 5.0817),
  meetingPoint: meetingT1,
);

PickupRowModel pickup(
  String id,
  String name, {
  int passengers = 2,
  String plate = 'AB-123-CD',
  FlightViewModel flight = const FlightViewModel(number: 'TO 3627', status: 'scheduled'),
  String? terminal = 'Terminal 1',
  DateTime? atMeetingPointAt,
  String? tripId,
}) => PickupRowModel(
  reservationId: id,
  reference: 'R$id',
  customerName: name,
  passengers: passengers,
  plate: plate,
  status: 'arrived',
  returnAt: t0.add(const Duration(hours: 1)),
  flight: flight,
  terminal: terminal,
  atMeetingPointAt: atMeetingPointAt,
  tripId: tripId,
);

StaffTripModel staffTrip({DateTime? startedAt, List<TripPassengerModel> passengers = const []}) {
  final start = startedAt ?? t0;
  return StaffTripModel(
    id: 't1',
    status: 'running',
    driverId: 'd1',
    driverName: 'Karim Benali',
    vehicle: const TripVehicleModel(model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK'),
    startedAt: start,
    expiresAt: start.add(const Duration(minutes: 90)),
    secondsLeft: 5400,
    passengers: passengers,
    meetingPoint: meetingT1,
  );
}

import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/pro_today/data/models/planning_model.dart';
import 'package:parking_app/src/features/pro_today/data/models/staff_signal_model.dart';
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

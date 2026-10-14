import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_occupation/data/models/occupation_models.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/widgets/reservation_tile.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_boarding.dart';
import 'package:parking_app/src/features/pro_today/data/models/planning_model.dart';
import 'package:parking_app/src/features/pro_today/presentation/bloc/pro_today_bloc.dart';
import 'package:parking_app/src/features/pro_today/presentation/pages/pro_today_page.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockTodayBloc extends MockBloc<ProTodayEvent, ProTodayState> implements ProTodayBloc {}

class MockLiveBloc extends MockBloc<LiveShuttlesEvent, LiveShuttlesState> implements LiveShuttlesBloc {}

/// « Embarquer en un geste » (14/10/2026): the driver's Arrivées and Retours tabs hand a traveller to the Navette tab.
void main() {
  setUpAll(setUpLocalizedTests);

  final now = DateTime.now();
  final planning = PlanningModel(
    date: '2026-10-14',
    parking: const PlanningParkingModel(id: 'p1', name: 'Parking Test'),
    arrivals: [
      row('a1', 'Vincent Blanc', 'DJ-150-MX', now.add(const Duration(minutes: 30))).copyWith(stopId: 's1'),
      row('a2', 'Chloé Moreau', 'BN-655-RT', now.subtract(const Duration(hours: 1)), status: 'arrived').copyWith(arrivedAt: now.subtract(const Duration(minutes: 50))),
      row('a3', 'Nadia Benali', 'CP-114-HM', now.subtract(const Duration(hours: 3)), status: 'shuttled_out'),
      row('a4', 'Sarah Cohen', 'KL-204-BA', now.add(const Duration(hours: 30))),
    ],
    returns: [
      row('b1', 'Marc Petit', 'AZ-902-LC', now.add(const Duration(hours: 1)), status: 'shuttled_out').copyWith(returnFlight: 'EJU 4412'),
      row('b2', 'Léa Durand', 'GH-456-JK', now.subtract(const Duration(hours: 1)), status: 'back_at_parking'),
    ],
  );

  Future<void> show(WidgetTester tester, Widget view, {String? date}) async {
    final today = MockTodayBloc();
    whenListen(today, const Stream<ProTodayState>.empty(), initialState: ProTodayState(now: now, planning: planning, date: date));
    final live = MockLiveBloc();
    whenListen(live, const Stream<LiveShuttlesState>.empty(), initialState: LiveShuttlesState(now: now));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProTodayBloc>.value(value: today),
          BlocProvider<LiveShuttlesBloc>.value(value: live),
        ],
        child: view,
      ),
    );
  }

  testWidgets('Arrivées : « Embarquer » sur les clients pas encore partis (attendus dans la journée, sur place), hors trajet', (tester) async {
    final requests = ShuttleBoardingRequests();
    final handed = <ShuttleBoarding>[];
    await show(tester, ProTodayView(only: TodaySide.arrivals, boarding: requests, onBoard: handed.add));
    expect(find.byKey(const Key('board-a1')), findsOneWidget);
    expect(find.byKey(const Key('board-a2')), findsOneWidget);
    expect(find.byKey(const Key('board-a3')), findsNothing, reason: 'already gone');
    expect(find.byKey(const Key('board-a4')), findsNothing, reason: 'expected in more than a day');
    expect(find.text('Embarquer'), findsNWidgets(2));

    await tester.tap(find.byKey(const Key('board-a1')));
    final boarding = handed.single;
    expect(boarding.direction, 'dropoff');
    expect(boarding.reservationId, 'a1');
    expect(boarding.departure?.customerName, 'Vincent Blanc');
    expect(boarding.departure?.expected, isTrue);
    // The stop's id: the Navette list groups the row under it.
    expect(boarding.departure?.stopId, 's1');
    expect(boarding.departure?.arrivedAt, isNull);

    // On site: the row reads like the server's, with the arrival recorded (no spot: the planning has none).
    await tester.tap(find.byKey(const Key('board-a2')));
    final onSite = handed.last.departure!;
    expect(onSite.reservationId, 'a2');
    expect(onSite.expected, isFalse);
    expect(onSite.arrivedAt, now.subtract(const Duration(minutes: 50)));
    expect(onSite.spot, isNull);

    // On a running trip: no button.
    requests.tripsChanged({'a2'});
    await tester.pump();
    expect(find.byKey(const Key('board-a2')), findsNothing);
    expect(find.byKey(const Key('board-a1')), findsOneWidget);

    // The driver's own trip runs: no second one, no button at all until it ends.
    requests.tripsChanged({'x1'}, running: true);
    await tester.pump();
    expect(find.text('Embarquer'), findsNothing);
    requests.tripsChanged(const {});
    await tester.pump();
    expect(find.text('Embarquer'), findsNWidgets(2));
  });

  testWidgets('Retours : « Récupérer » sur les clients partis ; rien sur un autre jour', (tester) async {
    final handed = <ShuttleBoarding>[];
    await show(tester, ProTodayView(only: TodaySide.returns, boarding: ShuttleBoardingRequests(), onBoard: handed.add));
    expect(find.byKey(const Key('board-b1')), findsOneWidget);
    expect(find.byKey(const Key('board-b2')), findsNothing);
    expect(find.text('Récupérer'), findsOneWidget);
    await tester.tap(find.byKey(const Key('board-b1')));
    expect(handed.single.direction, 'pickup');
    expect(handed.single.pickup?.plate, 'AZ-902-LC');
    expect(handed.single.pickup?.flight.number, 'EJU 4412');

    await show(tester, ProTodayView(only: TodaySide.returns, boarding: ShuttleBoardingRequests(), onBoard: handed.add), date: '2026-10-20');
    expect(find.byKey(const Key('board-b1')), findsNothing);
  });

  testWidgets('sans demande d\'embarquement (autres postes) : pas de bouton', (tester) async {
    await show(tester, const ProTodayView(only: TodaySide.arrivals));
    expect(find.text('Embarquer'), findsNothing);
  });

  testWidgets('voiturier : « Pointé à l\'embarquement par Karim », ou sans prénom', (tester) async {
    await pumpLocalized(tester, const SizedBox());
    final json = <String, dynamic>{
      'id': 'a1',
      'reference': 'A1',
      'customerName': 'Vincent Blanc',
      'plate': 'DJ-150-MX',
      'status': 'arrived',
      'arrivalAt': '2026-10-14T09:45',
      'returnAt': '2026-10-17T18:00',
    };
    final arrival = OccupantModel.fromJson({
      ...json,
      'boardingCheckIn': {'driverFirstName': 'Karim', 'at': '2026-10-14T07:47:00.000Z'},
    });
    expect(boardingCheckInText(arrival.boardingCheckIn!), 'Pointé à l\'embarquement par Karim');
    expect(boardingCheckInText(BoardingCheckInModel(at: DateTime.utc(2026, 10, 14))), 'Pointé à l\'embarquement');
    // Checked in at the desk (or an older server): no line.
    expect(OccupantModel.fromJson(json).boardingCheckIn, isNull);
    expect(OccupantModel.fromJson({...json, 'boardingCheckIn': null}).boardingCheckIn, isNull);
  });
}

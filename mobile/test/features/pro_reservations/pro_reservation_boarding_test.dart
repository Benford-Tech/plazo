import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/pages/pro_reservation_page.dart';
import 'package:parking_app/src/services/link_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/paperwork.dart';

class MockReservationBloc extends MockBloc<ProReservationEvent, ProReservationState> implements ProReservationBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// « Embarquer » in the booking's « Autres actions » (14/10/2026), and the check-in done at boarding.
void main() {
  setUpAll(setUpLocalizedTests);
  setUp(() {
    locator.registerSingleton<LinkService>(FakeLinks());
    registerQuietPaperwork();
  });
  tearDown(locator.reset);

  const karim = StaffModel(id: 'd1', name: 'Karim Benali', email: 'k@example.com', role: 'driver', post: 'driver', effectivePost: 'driver');
  final now = DateTime.now();
  ReservationModel booking({String status = 'upcoming', required DateTime arrivalAt, List<String> next = const ['arrived', 'cancelled', 'no_show'], BoardingCheckInModel? checkIn}) =>
      ReservationModel(
        id: 'r1',
        reference: 'PLZ-R1',
        channel: 'phone',
        status: status,
        arrivalAt: arrivalAt,
        returnAt: arrivalAt.add(const Duration(days: 3)),
        passengers: 1,
        customerName: 'Vincent Blanc',
        customerPhone: '0600000000',
        plate: 'DJ-150-MX',
        nextStatuses: next,
        boardingCheckIn: checkIn,
      );

  Future<void> show(WidgetTester tester, ReservationModel r) async {
    final bloc = MockReservationBloc();
    whenListen(bloc, const Stream<ProReservationState>.empty(), initialState: ProReservationState(reservation: r));
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: karim));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProReservationBloc>.value(value: bloc),
          BlocProvider<ProAuthBloc>.value(value: auth),
        ],
        child: const ProReservationPage(id: 'r1'),
      ),
      size: const Size(400, 1800),
    );
  }

  testWidgets('« Embarquer » pour un client attendu dans la journée', (tester) async {
    await show(tester, booking(arrivalAt: now.add(const Duration(hours: 2))));
    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('status-board')), findsOneWidget);
    expect(find.text('Embarquer'), findsOneWidget);
  });

  testWidgets('pas d\'« Embarquer » pour un client attendu dans plus d\'un jour', (tester) async {
    await show(tester, booking(arrivalAt: now.add(const Duration(days: 2))));
    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('status-board')), findsNothing);
  });

  testWidgets('la fiche dit qui a pointé le client à l\'embarquement', (tester) async {
    final at = now.subtract(const Duration(minutes: 20));
    await show(
      tester,
      booking(status: 'arrived', arrivalAt: now, next: const ['shuttled_out'], checkIn: BoardingCheckInModel(driverFirstName: 'Karim', at: at)),
    );
    expect(find.text('Pointé à l\'embarquement par Karim · ${hhmm(at)}'), findsOneWidget);
    expect(find.byKey(const Key('status-board')), findsNothing);
  });
}

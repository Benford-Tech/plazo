import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/data/datasources/reservation_trash_data_source.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/pages/pro_reservation_page.dart';
import 'package:parking_app/src/services/link_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/paperwork.dart';

class MockReservationBloc extends MockBloc<ProReservationEvent, ProReservationState> implements ProReservationBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

class FakeTrash implements ReservationTrashDataSource {
  final deleted = <(String, String?)>[];
  final restored = <String>[];

  @override
  Future<void> delete(String reservationId, {String? reason}) async => deleted.add((reservationId, reason));

  @override
  Future<bool> restore(String reservationId) async {
    restored.add(reservationId);
    return false;
  }
}

/// « Supprimer la réservation… » in « Autres actions » (03/11/2026): managers only, never a car at the parking.
void main() {
  setUpAll(setUpLocalizedTests);
  late FakeTrash trash;
  setUp(() {
    trash = FakeTrash();
    locator.registerSingleton<LinkService>(FakeLinks());
    locator.registerSingleton<ReservationTrashDataSource>(trash);
    registerQuietPaperwork();
  });
  tearDown(locator.reset);

  StaffModel staff(String role) => StaffModel(id: 's1', name: 'Joanny Simpore', email: 'j@example.com', role: role, post: role, effectivePost: role);
  ReservationModel booking({String status = 'upcoming', String channel = 'phone', List<String> next = const ['arrived', 'cancelled', 'no_show']}) =>
      ReservationModel(
        id: 'r1',
        reference: 'PLZ-R1',
        channel: channel,
        status: status,
        arrivalAt: DateTime.now().add(const Duration(days: 3)),
        returnAt: DateTime.now().add(const Duration(days: 6)),
        passengers: 1,
        customerName: 'Jean Dupont',
        customerPhone: '0600000000',
        plate: 'AB-123-CD',
        nextStatuses: next,
      );

  Future<void> show(WidgetTester tester, ReservationModel r, StaffModel who) async {
    final bloc = MockReservationBloc();
    whenListen(bloc, const Stream<ProReservationState>.empty(), initialState: ProReservationState(reservation: r));
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: ProAuthState(status: ProAuthStatus.signedIn, staff: who));
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

  testWidgets('un gérant supprime, avec une raison, et peut annuler', (tester) async {
    await show(tester, booking(), staff('manager'));
    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('status-delete')));
    await tester.pumpAndSettle();
    expect(find.text('Supprimer cette réservation ?'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('delete-reason')), 'Doublon');
    await tester.tap(find.byKey(const Key('delete-confirm')));
    await tester.pumpAndSettle();
    expect(trash.deleted, [('r1', 'Doublon')]);
    expect(find.text('Réservation supprimée.'), findsOneWidget);
    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();
    expect(trash.restored, ['r1']);
  });

  testWidgets('« Garder » ne supprime rien', (tester) async {
    await show(tester, booking(), staff('manager'));
    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('status-delete')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('delete-keep')));
    await tester.pumpAndSettle();
    expect(trash.deleted, isEmpty);
  });

  testWidgets('ni pour un autre rôle, ni pour une réservation Plazo, ni pour une voiture au parking', (tester) async {
    await show(tester, booking(), staff('agent'));
    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('status-delete')), findsNothing);
  });

  testWidgets('pas pour une réservation payée sur Plazo', (tester) async {
    await show(tester, booking(channel: 'plazo'), staff('manager'));
    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('status-delete')), findsNothing);
  });

  testWidgets('une réservation annulée se supprime aussi (menu montré pour elle seule)', (tester) async {
    await show(tester, booking(status: 'cancelled', next: const []), staff('manager'));
    expect(find.byKey(const Key('more-actions')), findsOneWidget);
    await show(tester, booking(status: 'arrived', next: const ['shuttled_out']), staff('manager'));
    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('status-delete')), findsNothing);
  });
}

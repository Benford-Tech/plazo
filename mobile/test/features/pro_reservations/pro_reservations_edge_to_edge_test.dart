import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/domain/usecases/reservations_use_cases.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_form_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/pages/pro_reservation_form_page.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/pages/pro_reservation_page.dart';
import 'package:parking_app/src/services/link_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';
import '../../helpers/paperwork.dart';

class MockReservationBloc extends MockBloc<ProReservationEvent, ProReservationState> implements ProReservationBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

class MockSave extends Mock implements SaveReservationUseCase {}

class MockCapacity extends Mock implements PreviewCapacityUseCase {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): the booking's sheet, its handover sheet and the form, pushed
/// above the shell, keep their buttons clear of the navigation bar and, in landscape, of a side bar or cutout.
void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const SaveReservationParams(input: ReservationInput(arrivalAt: '', returnAt: '')));
    registerFallbackValue(const CapacityParams(arrivalAt: '', returnAt: ''));
  });
  setUp(() {
    locator.registerSingleton<LinkService>(FakeLinks());
    registerQuietPaperwork();
  });
  tearDown(locator.reset);

  const agent = StaffModel(id: 'a1', name: 'Sarah Cohen', email: 's@example.com', role: 'manager', post: 'agent');
  final now = DateTime.now();
  ReservationModel booking({required String status, required List<String> next}) => ReservationModel(
    id: 'r1',
    reference: 'PLZ-R1',
    channel: 'phone',
    status: status,
    arrivalAt: now.subtract(const Duration(days: 3)),
    returnAt: now,
    passengers: 2,
    customerName: 'Vincent Blanc',
    customerPhone: '0600000000',
    plate: 'DJ-150-MX',
    returnFlight: 'AF 7641',
    notes: 'Siège bébé à l\'arrière.',
    nextStatuses: next,
  );

  Future<void> showSheet(WidgetTester tester, ReservationModel r, {Size size = const Size(400, 900)}) async {
    final bloc = MockReservationBloc();
    whenListen(bloc, const Stream<ProReservationState>.empty(), initialState: ProReservationState(reservation: r));
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: agent));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProReservationBloc>.value(value: bloc),
          BlocProvider<ProAuthBloc>.value(value: auth),
        ],
        child: const ProReservationPage(id: 'r1'),
      ),
      size: size,
    );
  }

  /// Scrolls the page's list to its very end, after checking that it does scroll (else the test proves nothing).
  Future<void> scrollToEnd(WidgetTester tester) async {
    final list = find.byType(ListView).first;
    final position = tester.state<ScrollableState>(find.descendant(of: list, matching: find.byType(Scrollable)).first).position;
    expect(position.maxScrollExtent, greaterThan(0));
    // A lazy list learns its extent as it scrolls: drag until the end stops moving.
    for (var i = 0; i < 20 && position.pixels < position.maxScrollExtent; i++) {
      await tester.drag(list, const Offset(0, -300));
      await tester.pumpAndSettle();
    }
    expect(position.pixels, position.maxScrollExtent);
  }

  testWidgets('fiche : « Autres actions », dernière ligne, reste au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await showSheet(tester, booking(status: 'upcoming', next: const ['arrived', 'cancelled', 'no_show']), size: const Size(400, 640));
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('more-actions')));
  });

  testWidgets('« Rendre le véhicule » : le bouton « Rendre » reste au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    // Wide enough for « De retour au parking » in the test font, whose glyphs are all one em wide.
    await showSheet(tester, booking(status: 'back_at_parking', next: const ['returned']), size: const Size(600, 900));
    await tester.dragUntilVisible(find.byKey(const Key('next-hand_over')), find.byType(ListView).first, const Offset(0, -300));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('next-hand_over')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('handover-confirm')), findsOneWidget);
    expectClearOfSystemBars(tester, find.byKey(const Key('handover-confirm')));
  });

  group('formulaire', () {
    const input = ReservationInput(channel: 'phone', arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-06T18:00', customerFirstName: 'Jean', customerLastName: 'Dupont', plate: 'GK-318-PX');

    Future<void> pumpForm(WidgetTester tester, Size size) async {
      final save = MockSave();
      final capacity = MockCapacity();
      when(() => capacity(any())).thenAnswer((_) async => const Right(CapacityPreviewModel(nights: 1)));
      await pumpLocalized(
        tester,
        BlocProvider(
          create: (_) => ProReservationFormBloc(save, capacity, id: 'r1', initial: input),
          child: const ProReservationFormPage(id: 'r1'),
        ),
        size: size,
      );
    }

    testWidgets('« Enregistrer », en fin de formulaire, reste au-dessus de la barre de navigation', (tester) async {
      setSystemBars(tester);
      await pumpForm(tester, const Size(400, 800));
      await scrollToEnd(tester);
      expectClearOfSystemBars(tester, find.byKey(const Key('f-save')));
    });

    testWidgets('paysage : le formulaire s\'écarte de l\'encoche et de la barre de navigation sur le côté', (tester) async {
      setSystemBars(tester, bottom: 0, left: 32, right: 48);
      await pumpForm(tester, const Size(800, 400));
      expectClearOfSystemBars(tester, find.byKey(const Key('f-arrival')));
      await scrollToEnd(tester);
      expectClearOfSystemBars(tester, find.byKey(const Key('f-save')));
    });
  });
}

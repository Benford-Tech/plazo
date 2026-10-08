import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_plan/data/models/plan_models.dart';
import 'package:parking_app/src/features/pro_spot_planning/data/models/files_planning_models.dart';
import 'package:parking_app/src/features/pro_spot_planning/presentation/bloc/pro_spot_planning_bloc.dart';
import 'package:parking_app/src/features/pro_spot_planning/presentation/pages/pro_spot_planning_page.dart';
import 'package:parking_app/src/shared/theme/theme.dart';

import '../../helpers/pump_app.dart';

class MockPlanningBloc extends MockBloc<ProSpotPlanningEvent, ProSpotPlanningState> implements ProSpotPlanningBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

const manager = StaffModel(id: 'u1', name: 'Nadia Roux', email: 'nadia@parkair.fr', role: 'manager');

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ProSpotPlanningRefreshed());
  });

  // Today is the planning's `from` (the parking's local day), never the phone's clock: the days are
  // fixed, and in the past of the phone running the test.
  const dPrev = '2026-10-03';
  const d0 = '2026-10-04';
  const d1 = '2026-10-05';
  const d2 = '2026-10-06';

  // F01 serves the 5th (two cars, out of order); F02 is free; F03 is kept by hand for the 6th; F04 was
  // kept for the 5th by the night preparation.
  const filesPlanning = FilesPlanningModel(
    from: d0,
    days: 3,
    timezone: 'Europe/Paris',
    capacity: 12,
    files: [
      FilesPlanningFileModel(id: 'f1', code: 'F01', capacity: 3, active: true, day: d1, cars: 2, sound: false),
      FilesPlanningFileModel(id: 'f2', code: 'F02', capacity: 3, active: true, cars: 0, sound: true),
      FilesPlanningFileModel(id: 'f3', code: 'F03', capacity: 3, active: true, plannedDay: d2, day: d2, cars: 0, sound: true, keptByHand: true),
      FilesPlanningFileModel(id: 'f4', code: 'F04', capacity: 3, active: true, plannedDay: d1, day: d1, cars: 0, sound: true),
    ],
    load: [
      FilesPlanningDayModel(date: dPrev, returns: 1, placed: 1, toCome: 0, onSite: 3, room: 0, missing: 0),
      FilesPlanningDayModel(date: d0, returns: 0, placed: 0, toCome: 0, onSite: 2, room: 0, missing: 0),
      FilesPlanningDayModel(date: d1, returns: 5, placed: 2, toCome: 3, onSite: 5, filesServing: ['F01'], filesKept: ['F04'], room: 4, missing: 0),
      FilesPlanningDayModel(date: d2, returns: 4, placed: 0, toCome: 4, onSite: 1, filesKept: ['F03'], room: 3, missing: 1),
    ],
    alerts: [
      FilesPlanningAlertModel(kind: 'missing_room', date: d2, count: 1),
      FilesPlanningAlertModel(kind: 'unsound', fileCode: 'F01', count: 1),
    ],
  );

  // Only F03, kept by hand for the 6th, is empty: nothing to offer on the 6th, F03 can move to the 5th.
  const onlyHandKept = FilesPlanningModel(
    from: d0,
    days: 3,
    timezone: 'Europe/Paris',
    capacity: 6,
    files: [
      FilesPlanningFileModel(id: 'f1', code: 'F01', capacity: 3, active: true, day: d1, cars: 2, sound: true),
      FilesPlanningFileModel(id: 'f3', code: 'F03', capacity: 3, active: true, plannedDay: d2, day: d2, cars: 0, sound: true, keptByHand: true),
    ],
    load: [
      FilesPlanningDayModel(date: d0, returns: 0, placed: 0, toCome: 0, onSite: 2, room: 0, missing: 0),
      FilesPlanningDayModel(date: d1, returns: 2, placed: 2, toCome: 0, onSite: 2, filesServing: ['F01'], room: 1, missing: 0),
      FilesPlanningDayModel(date: d2, returns: 1, placed: 0, toCome: 1, onSite: 1, filesKept: ['F03'], room: 3, missing: 0),
    ],
  );

  late MockPlanningBloc bloc;

  Future<void> show(WidgetTester tester, {StaffModel? staff = manager, FilesPlanningModel planning = filesPlanning}) async {
    bloc = MockPlanningBloc();
    whenListen(
      bloc,
      const Stream<ProSpotPlanningState>.empty(),
      initialState: ProSpotPlanningState(viewState: ViewState.success, parking: const ParkingSummaryModel(id: 'p1', name: 'Parkair', totalCapacity: 12), from: d0, days: 7, filesPlanning: planning),
    );
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: ProAuthState(status: ProAuthStatus.signedIn, staff: staff));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [BlocProvider<ProSpotPlanningBloc>.value(value: bloc), BlocProvider<ProAuthBloc>.value(value: auth)],
        child: const ProSpotPlanningPage(),
      ),
      size: const Size(400, 1800),
    );
  }

  testWidgets('en files : un jour par carte, les retours face aux files, « Manque N », les files avec leurs badges', (tester) async {
    await show(tester);
    expect(find.text('Planning des files'), findsOneWidget);
    expect(find.byKey(const Key('files-planning')), findsOneWidget);
    expect(find.text('12 places dans 4 file(s)'), findsOneWidget);
    expect(find.byKey(const Key('day-$d0')), findsOneWidget);
    expect(find.byKey(const Key('day-$d1')), findsOneWidget);
    expect(find.text('5 retour(s) · 3 à venir'), findsOneWidget);
    expect(find.byKey(const Key('missing-$d2')), findsOneWidget);
    expect(find.text('Manque 1'), findsOneWidget);
    expect(find.byKey(const Key('chip-F01')), findsOneWidget);
    expect(find.byKey(const Key('chip-F03')), findsOneWidget);
    expect(find.byKey(const Key('chip-F04')), findsOneWidget);
    expect(find.byKey(const Key('files-alert-missing_room')), findsOneWidget);
    expect(find.byKey(const Key('files-alert-unsound')), findsOneWidget);
    expect(find.byKey(const Key('file-F01')), findsOneWidget);
    expect(find.byKey(const Key('unsound-F01')), findsOneWidget);
    expect(find.byKey(const Key('by-hand-F03')), findsOneWidget);
    expect(find.text('à la main'), findsOneWidget);
    // Kept by the preparation, not by hand: no badge, no cross.
    expect(find.byKey(const Key('by-hand-F04')), findsNothing);
    expect(find.byKey(const Key('free-F04')), findsNothing);
    // The spot grid is not drawn.
    expect(find.byKey(const Key('planning-all')), findsNothing);
  });

  testWidgets('aujourd’hui vient du planning : « Réserver une file » dès son premier jour, jamais avant', (tester) async {
    await show(tester);
    // The phone's clock is well past these days: the button still shows from the planning's first day.
    expect(find.byKey(const Key('keep-day-$d0')), findsOneWidget);
    expect(find.byKey(const Key('keep-day-$d1')), findsOneWidget);
    expect(find.byKey(const Key('keep-day-$d2')), findsOneWidget);
    expect(find.byKey(const Key('keep-day-$dPrev')), findsNothing);
    // The planning's first day is the one drawn as today.
    Color? fill(String day) => (tester.widget<Container>(find.byKey(Key('day-$day'))).decoration as BoxDecoration?)?.color;
    expect(fill(d0), AppColors.tintSoft);
    expect(fill(d1), isNot(AppColors.tintSoft));
    // The day of a kept file is spelt from the planning too (F04, kept for the 5th, is the last row).
    await tester.scrollUntilVisible(find.byKey(const Key('file-F04')), 200, scrollable: find.byType(Scrollable).first);
    expect(find.text('Gardée pour lun. 5 oct.'), findsOneWidget);
  });

  testWidgets('« Réserver une file » liste les files vides ; en choisir une garde la file pour ce jour', (tester) async {
    await show(tester);
    await tester.ensureVisible(find.byKey(const Key('keep-day-$d1')));
    await tester.tap(find.byKey(const Key('keep-day-$d1')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('keep-F02')), findsOneWidget);
    // Kept by hand for another day: it can move.
    expect(find.byKey(const Key('keep-F03')), findsOneWidget);
    // A file holding cars is not offered.
    expect(find.byKey(const Key('keep-F01')), findsNothing);
    await tester.tap(find.byKey(const Key('keep-F02')));
    await tester.pumpAndSettle();
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ProSpotPlanningFileKept>().having((e) => e.fileId, 'fileId', 'f2').having((e) => e.day, 'day', d1));
  });

  testWidgets('une file gardée par la préparation reste proposée, pour la verrouiller à la main', (tester) async {
    await show(tester);
    await tester.ensureVisible(find.byKey(const Key('keep-day-$d1')));
    await tester.tap(find.byKey(const Key('keep-day-$d1')));
    await tester.pumpAndSettle();
    final row = find.byKey(const Key('keep-F04'));
    expect(row, findsOneWidget);
    expect(tester.widget<ListTile>(row).enabled, isTrue);
    expect(find.text('3 · gardée par la préparation · verrouiller'), findsOneWidget);
    await tester.tap(row);
    await tester.pumpAndSettle();
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ProSpotPlanningFileKept>().having((e) => e.fileId, 'fileId', 'f4').having((e) => e.day, 'day', d1));
  });

  testWidgets('une file déjà gardée à la main pour ce jour est grisée', (tester) async {
    await show(tester);
    await tester.ensureVisible(find.byKey(const Key('keep-day-$d2')));
    await tester.tap(find.byKey(const Key('keep-day-$d2')));
    await tester.pumpAndSettle();
    final row = find.byKey(const Key('keep-F03'));
    expect(row, findsOneWidget);
    expect(tester.widget<ListTile>(row).enabled, isFalse);
    expect(find.text('3 · déjà gardée pour ce jour'), findsOneWidget);
    await tester.tap(row, warnIfMissed: false);
    await tester.pumpAndSettle();
    verifyNever(() => bloc.add(any()));
  });

  testWidgets('sans file à proposer pour un jour, pas de bouton « Réserver une file »', (tester) async {
    await show(tester, planning: onlyHandKept);
    // The 6th only has F03, already kept by hand for it; on the 5th F03 could move.
    expect(find.byKey(const Key('keep-day-$d2')), findsNothing);
    expect(find.byKey(const Key('keep-day-$d1')), findsOneWidget);
    expect(find.byKey(const Key('keep-day-$d0')), findsOneWidget);
  });

  testWidgets('la croix d’une file gardée à la main la libère', (tester) async {
    await show(tester);
    await tester.ensureVisible(find.byKey(const Key('free-F03')));
    await tester.tap(find.byKey(const Key('free-F03')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ProSpotPlanningFileKept>().having((e) => e.fileId, 'fileId', 'f3').having((e) => e.day, 'day', isNull));
  });

  // Every role may keep a file (reservations:status, as the valet places the cars); without a known
  // role the page stays read-only.
  testWidgets('sans rôle connu : le planning se lit, sans réserver ni préparer', (tester) async {
    await show(tester, staff: null);
    expect(find.byKey(const Key('files-planning')), findsOneWidget);
    expect(find.byKey(const Key('keep-day-$d1')), findsNothing);
    expect(find.byKey(const Key('free-F03')), findsNothing);
    expect(find.byKey(const Key('files-prepare')), findsNothing);
  });
}

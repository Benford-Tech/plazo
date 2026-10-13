import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/helpers/money.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_dashboard/domain/usecases/get_dashboard_use_case.dart';
import 'package:parking_app/src/features/pro_dashboard/presentation/bloc/pro_dashboard_bloc.dart';
import 'package:parking_app/src/features/pro_dashboard/presentation/widgets/dashboard_view.dart';
import 'package:parking_app/src/features/pro_revenue/domain/usecases/revenue_use_cases.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/bloc/pro_revenue_bloc.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/bloc/revenue_summary_bloc.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/pages/pro_revenue_missing_page.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/pages/pro_revenue_page.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';
import '../pro_dashboard/pro_dashboard_test.dart' show dashboard;
import 'revenue_fixtures.dart';

class MockDashboard extends Mock implements GetDashboardUseCase {}

class MockSummary extends Mock implements GetRevenueSummaryUseCase {}

class MockReport extends Mock implements GetRevenueReportUseCase {}

class MockSetPrice extends Mock implements SetReservationPriceUseCase {}

class MockLiveBloc extends MockBloc<LiveShuttlesEvent, LiveShuttlesState> implements LiveShuttlesBloc {}

/// A few frames, not pumpAndSettle: a focused field's cursor blinks for ever.
Future<void> settle(WidgetTester tester) async {
  for (var i = 0; i < 5; i++) {
    await tester.pump(const Duration(milliseconds: 50));
  }
}

void main() {
  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const RevenueReportParams(from: '', to: ''));
    registerFallbackValue(const SetReservationPriceParams(id: '', priceCents: 0));
    return setUpLocalizedTests();
  });

  Future<MockSummary> showDashboard(WidgetTester tester, {required bool revenue}) async {
    final get = MockDashboard();
    when(() => get(any())).thenAnswer((_) async => Right(dashboard));
    final summaryUseCase = MockSummary();
    when(() => summaryUseCase(any())).thenAnswer((_) async => const Right(summary));
    final live = MockLiveBloc();
    whenListen(
      live,
      const Stream<LiveShuttlesState>.empty(),
      initialState: LiveShuttlesState(
        now: t0,
        data: LiveShuttlesModel(
          serverTime: t0,
          parking: const LiveParkingModel(id: 'p1', name: 'P'),
        ),
      ),
    );
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProDashboardBloc>(create: (_) => ProDashboardBloc(get, clock: () => t0, autoPoll: false)..add(const ProDashboardStarted())),
          BlocProvider<LiveShuttlesBloc>.value(value: live),
          BlocProvider<RevenueSummaryBloc>(create: (_) => RevenueSummaryBloc(summaryUseCase, autoPoll: false)..add(const RevenueSummaryStarted())),
        ],
        child: Scaffold(body: DashboardView(revenue: revenue)),
      ),
    );
    await tester.pumpAndSettle(const Duration(milliseconds: 100), EnginePhase.sendSemanticsUpdate, const Duration(seconds: 5));
    return summaryUseCase;
  }

  testWidgets('T-A : le gérant voit le chiffre du mois sous les tuiles, aujourd’hui, 7 jours et les montants manquants', (tester) async {
    await showDashboard(tester, revenue: true);
    final tile = find.byKey(const Key('revenue-tile'));
    expect(tile, findsOneWidget);
    expect(find.descendant(of: tile, matching: find.text("CHIFFRE D'AFFAIRES · OCTOBRE")), findsOneWidget);
    expect(find.descendant(of: tile, matching: find.text(formatEuros(1248000))), findsOneWidget);
    expect(find.descendant(of: tile, matching: find.text(formatEuros(32000))), findsOneWidget);
    expect(find.descendant(of: tile, matching: find.text(formatEuros(214000))), findsOneWidget);
    expect(find.descendant(of: tile, matching: find.text('3 sans montant')), findsOneWidget);
  });

  testWidgets('les autres rôles n’ont pas la carte et le serveur n’est pas interrogé', (tester) async {
    final summaryUseCase = await showDashboard(tester, revenue: false);
    expect(find.byKey(const Key('revenue-tile')), findsNothing);
    verifyNever(() => summaryUseCase(any()));
  });

  test('une première lecture en échec cache la carte', () async {
    final summaryUseCase = MockSummary();
    when(() => summaryUseCase(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 403, code: 'forbidden')));
    final bloc = RevenueSummaryBloc(summaryUseCase, autoPoll: false)..add(const RevenueSummaryStarted());
    await bloc.stream.firstWhere((s) => !s.viewState.isProcessing);
    expect(bloc.state.data, isNull);
    await bloc.close();
  });

  Future<ProRevenueBloc> showPage(WidgetTester tester, {MockSetPrice? setPrice}) async {
    final report = MockReport();
    when(() => report(any())).thenAnswer((i) async {
      final p = i.positionalArguments.first as RevenueReportParams;
      final days = octoberReport.byDay.where((d) => d.date.compareTo(p.from) >= 0 && d.date.compareTo(p.to) <= 0).toList();
      return Right(octoberReport.copyWith(from: p.from, to: p.to, basis: p.basis, byDay: days));
    });
    final bloc = ProRevenueBloc(report, setPrice ?? MockSetPrice(), clock: () => DateTime(2026, 10, 13, 9))..add(const ProRevenueStarted());
    await pumpLocalized(
      tester,
      BlocProvider.value(value: bloc, child: const ProRevenueView()),
      size: const Size(390, 1300),
    );
    await tester.pumpAndSettle(const Duration(milliseconds: 100), EnginePhase.sendSemanticsUpdate, const Duration(seconds: 5));
    return bloc;
  }

  testWidgets('P-B : le total d’abord, les barres du mois, « À compléter » et les canaux', (tester) async {
    final bloc = await showPage(tester);
    expect(find.text('Octobre 2026'), findsOneWidget);
    expect(find.byKey(const Key('revenue-total')), findsOneWidget);
    expect(find.text(formatEuros(1248000)), findsOneWidget);
    expect(find.text('86 réservation(s) · panier moyen ${formatEuros(14512)} · 6,4 jours'), findsOneWidget);
    expect(find.text("PAR JOUR D'ARRIVÉE"), findsOneWidget);
    expect(find.text('Meilleur jour : sam. 3 oct. · ${formatEuros(79000)}'), findsOneWidget);
    expect(find.text('auj. 13'), findsOneWidget);
    expect(find.text('Barres claires : réservations déjà prises pour les jours à venir.'), findsOneWidget);
    expect(find.text('À compléter'), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('revenue-channel-0')), matching: find.textContaining('Plazo')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('revenue-channel-1')), matching: find.textContaining('Allopark')), findsOneWidget);
    expect(find.text(formatEuros(421000)), findsOneWidget);

    // Touching a bar reads its day.
    final chart = find.byKey(const Key('revenue-chart'));
    await tester.tapAt(tester.getTopLeft(chart) + const Offset(2, 60));
    await tester.pump();
    expect(find.text('jeu. 1 oct. · 2 réservation(s) · ${formatEuros(30000)}'), findsOneWidget);

    await tester.tap(find.byKey(const Key('revenue-basis')));
    await tester.pumpAndSettle(const Duration(milliseconds: 100), EnginePhase.sendSemanticsUpdate, const Duration(seconds: 5));
    expect(bloc.state.basis, 'booked');
    expect(find.text('PAR JOUR DE RÉSERVATION'), findsOneWidget);

    await tester.tap(find.byKey(const Key('revenue-span-day')));
    await tester.pumpAndSettle(const Duration(milliseconds: 100), EnginePhase.sendSemanticsUpdate, const Duration(seconds: 5));
    expect(find.text("Aujourd'hui"), findsOneWidget);
    expect(find.byKey(const Key('revenue-chart')), findsNothing);
    await tester.tap(find.byKey(const Key('revenue-prev')));
    await tester.pumpAndSettle(const Duration(milliseconds: 100), EnginePhase.sendSemanticsUpdate, const Duration(seconds: 5));
    expect(find.text('Hier'), findsOneWidget);
  });

  testWidgets('À compléter : montant invalide sous la ligne, puis enregistré avec sa bannière', (tester) async {
    final setPrice = MockSetPrice();
    when(() => setPrice(any())).thenAnswer((_) async => const Right(null));
    final bloc = await showPage(tester, setPrice: setPrice);
    await pumpLocalized(
      tester,
      BlocProvider.value(
        value: bloc,
        child: ProRevenueMissingPage(bloc: bloc),
      ),
      size: const Size(390, 1100),
    );
    await tester.pumpAndSettle(const Duration(milliseconds: 100), EnginePhase.sendSemanticsUpdate, const Duration(seconds: 5));
    expect(find.text('À compléter · 3'), findsOneWidget);
    expect(find.text('Marc Petit'), findsOneWidget);
    expect(find.text('Allopark · AL-48213 · arrivée 21 oct.'), findsOneWidget);
    expect(find.text('Les réservations payées sur Plazo ne figurent jamais ici : leur prix est celui payé en ligne.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('revenue-amount-r3')), '12,5,0');
    await tester.tap(find.byKey(const Key('revenue-save-r3')));
    await settle(tester);
    expect(find.text('Montant invalide (ex. 45,50).'), findsOneWidget);
    verifyNever(() => setPrice(any()));

    await tester.enterText(find.byKey(const Key('revenue-amount-r1')), '64,90');
    await tester.tap(find.byKey(const Key('revenue-save-r1')));
    await settle(tester);
    verify(() => setPrice(const SetReservationPriceParams(id: 'r1', priceCents: 6490))).called(1);
    expect(find.text('Montant enregistré : Marc Petit, ${formatEuros(6490)}'), findsOneWidget);
  });

  test('un montant enregistré depuis la page (même ouverte par Plus) relit la carte du tableau de bord', () async {
    final summaryUseCase = MockSummary();
    when(() => summaryUseCase(any())).thenAnswer((_) async => const Right(summary));
    final changes = StreamController<void>.broadcast();
    final bloc = RevenueSummaryBloc(summaryUseCase, changes: changes.stream, autoPoll: false)..add(const RevenueSummaryStarted());
    await bloc.stream.firstWhere((s) => s.data != null);
    changes.add(null);
    await Future<void>.delayed(const Duration(milliseconds: 10));
    verify(() => summaryUseCase(any())).called(2);
    await bloc.close();
    await changes.close();
  });
}

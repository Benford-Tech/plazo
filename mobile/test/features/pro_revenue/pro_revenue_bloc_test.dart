import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/pro_revenue/data/models/revenue_models.dart';
import 'package:parking_app/src/features/pro_revenue/domain/revenue_period.dart';
import 'package:parking_app/src/features/pro_revenue/domain/usecases/revenue_use_cases.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/bloc/pro_revenue_bloc.dart';

import 'revenue_fixtures.dart';

class MockReport extends Mock implements GetRevenueReportUseCase {}

class MockSetPrice extends Mock implements SetReservationPriceUseCase {}

void main() {
  setUpAll(() {
    registerFallbackValue(const RevenueReportParams(from: '', to: ''));
    registerFallbackValue(const SetReservationPriceParams(id: '', priceCents: 0));
  });

  late MockReport report;
  late MockSetPrice setPrice;

  setUp(() {
    report = MockReport();
    setPrice = MockSetPrice();
    when(() => report(any())).thenAnswer((i) async {
      final p = i.positionalArguments.first as RevenueReportParams;
      return Right(octoberReport.copyWith(from: p.from, to: p.to, basis: p.basis));
    });
  });

  ProRevenueBloc bloc({DateTime? now}) => ProRevenueBloc(report, setPrice, clock: () => now ?? DateTime(2026, 10, 13, 9));

  /// Waits for the bloc to finish the reads under way (the use cases answer at once).
  Future<ProRevenueState> settle(ProRevenueBloc b) async {
    await Future<void>.delayed(const Duration(milliseconds: 5));
    for (var i = 0; i < 200 && (b.state.viewState.isProcessing || b.state.report == null); i++) {
      await Future<void>.delayed(const Duration(milliseconds: 1));
    }
    return b.state;
  }

  test('ouvre sur le mois en cours, par jour d’arrivée', () async {
    final b = bloc()..add(const ProRevenueStarted());
    final s = await settle(b);
    verify(() => report(const RevenueReportParams(from: '2026-10-01', to: '2026-10-31'))).called(1);
    expect(s.report!.totalCents, 1248000);
    expect(s.today, '2026-10-13');
    await b.close();
  });

  test('le téléphone se trompe de mois : la page se cale sur le jour du parking', () async {
    final b = bloc(now: DateTime(2026, 9, 30, 23, 30))..add(const ProRevenueStarted());
    await Future<void>.delayed(const Duration(milliseconds: 50));
    verify(() => report(const RevenueReportParams(from: '2026-09-01', to: '2026-09-30'))).called(1);
    verify(() => report(const RevenueReportParams(from: '2026-10-01', to: '2026-10-31'))).called(1);
    expect(b.state.anchor, '2026-10-13');
    expect(b.state.period, (from: '2026-10-01', to: '2026-10-31'));
    await b.close();
  });

  test('‹ puis Semaine puis « Par réservation » : chaque fois la bonne période et le bon mode', () async {
    final b = bloc()..add(const ProRevenueStarted());
    await settle(b);
    b.add(const ProRevenueStepped(-1));
    await settle(b);
    verify(() => report(const RevenueReportParams(from: '2026-09-01', to: '2026-09-30'))).called(1);
    b.add(const ProRevenueSpanChanged(RevenueSpan.week));
    await settle(b);
    // September does not hold today: the week of its first day.
    verify(() => report(const RevenueReportParams(from: '2026-08-31', to: '2026-09-06'))).called(1);
    b.add(const ProRevenueBasisChanged('booked'));
    await settle(b);
    verify(() => report(const RevenueReportParams(from: '2026-08-31', to: '2026-09-06', basis: 'booked'))).called(1);
    await b.close();
  });

  test('une réponse arrivée après un changement de période est ignorée', () async {
    final slow = Completer<Either<Failure, RevenueReportModel>>();
    final b = bloc()..add(const ProRevenueStarted());
    await settle(b);
    when(() => report(const RevenueReportParams(from: '2026-09-01', to: '2026-09-30'))).thenAnswer((_) => slow.future);
    b.add(const ProRevenueStepped(-1));
    await Future<void>.delayed(Duration.zero);
    b.add(const ProRevenueStepped(-1));
    await settle(b);
    slow.complete(Right(octoberReport.copyWith(from: '2026-09-01', to: '2026-09-30', totalCents: 1)));
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(b.state.report!.from, '2026-08-01');
    expect(b.state.report!.totalCents, isNot(1));
    await b.close();
  });

  test('montant invalide : rien n’est envoyé', () async {
    final b = bloc()..add(const ProRevenueStarted());
    await settle(b);
    b.add(const ProRevenuePriceSubmitted(id: 'r1', text: '12,5,0'));
    await Future<void>.delayed(Duration.zero);
    expect(b.state.rowErrors['r1']?.code, 'invalid');
    b.add(const ProRevenuePriceSubmitted(id: 'r1', text: ''));
    await Future<void>.delayed(Duration.zero);
    expect(b.state.rowErrors['r1']?.code, 'invalid');
    verifyNever(() => setPrice(any()));
    await b.close();
  });

  test('montant enregistré : la réservation quitte la liste, le chiffre est relu', () async {
    when(() => setPrice(any())).thenAnswer((_) async => const Right(null));
    final b = bloc()..add(const ProRevenueStarted());
    await settle(b);
    final after = octoberReport.copyWith(totalCents: 1248000 + 6490, count: 87, withoutAmount: 2, missing: octoberReport.missing.skip(1).toList());
    when(() => report(any())).thenAnswer((_) async => Right(after));
    b.add(const ProRevenuePriceSubmitted(id: 'r1', text: '64,90'));
    await b.stream.firstWhere((s) => s.savedCents != null);
    verify(() => setPrice(const SetReservationPriceParams(id: 'r1', priceCents: 6490))).called(1);
    expect(b.state.savedName, 'Marc Petit');
    expect(b.state.report!.missing.map((m) => m.id), isNot(contains('r1')));
    expect(b.state.report!.withoutAmount, 2);
    await Future<void>.delayed(const Duration(milliseconds: 20));
    verify(() => report(any())).called(2);
    expect(b.state.report!.totalCents, 1254490);
    await b.close();
  });

  test('prix verrouillé (payé sur Plazo) ou réservation annulée : l’erreur reste sur sa ligne', () async {
    when(() => setPrice(const SetReservationPriceParams(id: 'r1', priceCents: 1000)))
        .thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'priceCents': 'price_locked'})));
    when(() => setPrice(const SetReservationPriceParams(id: 'r2', priceCents: 1000)))
        .thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'reservation_closed')));
    final b = bloc()..add(const ProRevenueStarted());
    await settle(b);
    b.add(const ProRevenuePriceSubmitted(id: 'r1', text: '10'));
    b.add(const ProRevenuePriceSubmitted(id: 'r2', text: '10'));
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(b.state.rowErrors['r1']?.code, 'price_locked');
    expect(b.state.rowErrors['r2']?.code, 'reservation_closed');
    expect(b.state.saving, isEmpty);
    expect(b.state.report!.missing, hasLength(3));
    await b.close();
  });

  test('une relecture plus ancienne qui arrive après une plus récente est ignorée (la ligne enregistrée ne revient pas)', () async {
    when(() => setPrice(any())).thenAnswer((_) async => const Right(null));
    final b = bloc()..add(const ProRevenueStarted());
    await settle(b);
    final slow = Completer<Either<Failure, RevenueReportModel>>();
    // The read after A's save is slow and still lists B; the one after B's save is not.
    when(() => report(any())).thenAnswer((_) => slow.future);
    b.add(const ProRevenuePriceSubmitted(id: 'r1', text: '10'));
    await Future<void>.delayed(const Duration(milliseconds: 5));
    final afterBoth = octoberReport.copyWith(withoutAmount: 1, missing: [octoberReport.missing.last]);
    when(() => report(any())).thenAnswer((_) async => Right(afterBoth));
    b.add(const ProRevenuePriceSubmitted(id: 'r2', text: '20'));
    await Future<void>.delayed(const Duration(milliseconds: 5));
    expect(b.state.report!.missing.map((m) => m.id), ['r3']);
    slow.complete(Right(octoberReport.copyWith(withoutAmount: 2, missing: octoberReport.missing.skip(1).toList())));
    await Future<void>.delayed(const Duration(milliseconds: 5));
    expect(b.state.report!.missing.map((m) => m.id), ['r3']);
    expect(b.state.report!.withoutAmount, 1);
    await b.close();
  });

  test('passé minuit en fin de mois, la relecture se recale sur le nouveau mois sans garder les chiffres de l’ancien', () async {
    final b = bloc(now: DateTime(2026, 10, 31, 23))..add(const ProRevenueStarted());
    await settle(b);
    final november = Completer<Either<Failure, RevenueReportModel>>();
    when(() => report(any())).thenAnswer((i) {
      final p = i.positionalArguments.first as RevenueReportParams;
      if (p.from == '2026-11-01') return november.future;
      return Future.value(Right(octoberReport.copyWith(today: '2026-11-01')));
    });
    b.add(const ProRevenueRefreshed());
    await Future<void>.delayed(const Duration(milliseconds: 5));
    expect(b.state.anchor, '2026-11-01');
    expect(b.state.report, isNull);
    november.complete(const Left(ServerFailure(message: 'Hors ligne')));
    await Future<void>.delayed(const Duration(milliseconds: 5));
    expect(b.state.viewState, ViewState.error);
    await b.close();
  });

  test('changer de période efface « Montant enregistré », et un enregistrement fini ailleurs ne touche pas la nouvelle période', () async {
    final put = Completer<Either<Failure, void>>();
    when(() => setPrice(any())).thenAnswer((_) => put.future);
    final b = bloc()..add(const ProRevenueStarted());
    await settle(b);
    b.add(const ProRevenuePriceSubmitted(id: 'r1', text: '10'));
    await Future<void>.delayed(const Duration(milliseconds: 5));
    b.add(const ProRevenueStepped(-1));
    await settle(b);
    final before = b.state.report!;
    put.complete(const Right(null));
    await Future<void>.delayed(const Duration(milliseconds: 5));
    expect(b.state.savedName, isNull);
    expect(b.state.saving, isEmpty);
    expect(b.state.report!.withoutAmount, before.withoutAmount);
    await b.close();
  });
}

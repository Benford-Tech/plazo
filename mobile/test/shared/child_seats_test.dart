import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/shared/child_seats/child_seats.dart';
import 'package:parking_app/src/shared/widgets/child_seat_widgets.dart';

import '../helpers/pump_app.dart';

/// « Sièges auto » (24/10/2026, direction B « par âge »): the model, its rules and its French texts.
void main() {
  setUpAll(setUpLocalizedTests);

  group('ChildSeats', () {
    test('rien par défaut, total, somme, copie par sorte', () {
      expect(ChildSeats.none.total, 0);
      expect(ChildSeats.none.any, isFalse);
      const seats = ChildSeats(infant: 1, booster: 2);
      expect(seats.total, 3);
      expect(seats.any, isTrue);
      expect(seats.of(ChildSeatKind.booster), 2);
      expect(seats.withKind(ChildSeatKind.toddler, 1), const ChildSeats(infant: 1, toddler: 1, booster: 2));
      expect(ChildSeats.sum([seats, const ChildSeats(toddler: 1), ChildSeats.none]), const ChildSeats(infant: 1, toddler: 1, booster: 2));
      expect(seats, const ChildSeats(infant: 1, booster: 2));
      expect(seats.hashCode, const ChildSeats(infant: 1, booster: 2).hashCode);
    });

    test('JSON : un objet absent ou incomplet vaut zéro, toJson rend les trois comptes', () {
      expect(ChildSeats.fromJson(const {}), ChildSeats.none);
      expect(ChildSeats.fromJson(const {'infant': 1, 'booster': 2.0}), const ChildSeats(infant: 1, booster: 2));
      expect(ChildSeats.fromJson(const {'infant': -3}), ChildSeats.none);
      expect(const ChildSeats(toddler: 1).toJson(), {'infant': 0, 'toddler': 1, 'booster': 0});
    });

    test('refus : 0 à 4 par sorte, et moins de sièges que de passagers (un adulte au moins)', () {
      expect(ChildSeats.none.refusal(1), isNull);
      expect(const ChildSeats(infant: 1).refusal(2), isNull);
      expect(const ChildSeats(infant: 1).refusal(1), 'child_seats_exceed_passengers');
      expect(const ChildSeats(infant: 1, booster: 1).refusal(2), 'child_seats_exceed_passengers');
      expect(const ChildSeats(booster: 5).refusal(9), 'child_seats_range');
    });
  });

  testWidgets('textes : résumé, ligne de chargement, « dont N enfants », pastilles et bandeau', (tester) async {
    await pumpLocalized(
      tester,
      const Scaffold(
        body: Column(
          children: [
            ChildSeatPills(seats: ChildSeats(infant: 1, booster: 2)),
            ChildSeatsLoadBanner(seats: ChildSeats(infant: 1, toddler: 1, booster: 1)),
            ChildSeatPills(seats: ChildSeats.none),
          ],
        ),
      ),
    );
    expect(childSeatsSummary(const ChildSeats(infant: 1, booster: 2)), '1 siège bébé · 2 réhausseurs');
    expect(childSeatsSummary(const ChildSeats(toddler: 2), separator: ', '), '2 sièges 1 à 4 ans');
    expect(childSeatsSummary(ChildSeats.none), '');
    expect(childSeatsLoadingLine(const ChildSeats(infant: 1, toddler: 1, booster: 1)), '1 siège bébé (dos à la route) · 1 siège 1 à 4 ans · 1 réhausseur');
    expect(childSeatsChildren(const ChildSeats(infant: 1)), 'dont 1 enfant');
    expect(childSeatsChildren(const ChildSeats(infant: 1, booster: 2)), 'dont 3 enfants');
    expect(childSeatsChildren(ChildSeats.none), '');
    // One pill per kind asked: the badge for one seat, the count beyond.
    expect(find.text('Siège bébé'), findsOneWidget);
    expect(find.text('2 réhausseurs'), findsOneWidget);
    expect(find.byKey(const Key('child-seat-pill-toddler')), findsNothing);
    expect(find.text('À charger avant de partir'), findsOneWidget);
    expect(find.text('1 siège bébé (dos à la route) · 1 siège 1 à 4 ans · 1 réhausseur'), findsOneWidget);
  });

  testWidgets('les trois compteurs : de 0 à 4, cibles de 44 px', (tester) async {
    var seats = ChildSeats.none;
    await pumpLocalized(
      tester,
      Scaffold(
        body: StatefulBuilder(
          builder: (context, setState) => ChildSeatsEditor(seats: seats, onChanged: (s) => setState(() => seats = s)),
        ),
      ),
    );
    expect(find.text("Bébé · jusqu'à 12 mois"), findsOneWidget);
    expect(find.text('Siège dos à la route'), findsOneWidget);
    expect(find.text('1 à 4 ans'), findsOneWidget);
    expect(find.text('4 à 10 ans'), findsOneWidget);
    expect(find.text('Réhausseur'), findsOneWidget);
    expect(tester.getSize(find.byKey(const Key('child-seat-more-infant'))), const Size(44, 44));
    for (var i = 0; i < 5; i++) {
      await tester.tap(find.byKey(const Key('child-seat-more-infant')));
      await tester.pump();
    }
    expect(seats, const ChildSeats(infant: 4), reason: '4 at most');
    await tester.tap(find.byKey(const Key('child-seat-less-infant')));
    await tester.pump();
    expect(seats, const ChildSeats(infant: 3));
    await tester.tap(find.byKey(const Key('child-seat-more-booster')));
    await tester.pump();
    expect(seats, const ChildSeats(infant: 3, booster: 1));
    expect(tester.widget<Text>(find.byKey(const Key('child-seat-count-infant'))).data, '3');
  });
}

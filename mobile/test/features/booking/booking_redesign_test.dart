import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/presentation/widgets/booking_card.dart';
import 'package:parking_app/src/features/booking/presentation/widgets/booking_steps.dart';
import 'package:parking_app/src/features/paperwork/data/datasources/paperwork_data_source.dart';
import 'package:parking_app/src/features/paperwork/data/models/paperwork_models.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

/// « Ma réservation », mix of A and C (13/11/2026): the ticket, the steps, the next thing to do.
class _Paperwork implements PaperworkDataSource {
  _Paperwork(this.toSign);
  final bool toSign;

  @override
  Future<PaperworkModel> load(PaperworkOwner owner) async => PaperworkModel(
    status: 'upcoming',
    contract: ContractModel(
      status: 'unsigned',
      canSign: toSign,
      atCounter: true,
      travellerCanSign: toSign,
      codeAvailable: toSign,
      phoneMasked: '06 •• •• •• 78',
      document: const ContractDocumentModel(title: 'Contrat', summary: [], clauses: []),
    ),
  );

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  setUpAll(setUpLocalizedTests);
  tearDown(locator.reset);

  testWidgets('le billet : heures de dépôt et de retour en grand, nombre de jours, plaque et référence', (tester) async {
    await pumpLocalized(tester, Scaffold(body: BookingCard(booking: booking(), returnDay: false)));
    expect(find.byKey(const Key('booking-ticket')), findsOneWidget);
    expect(find.text('08:00'), findsOneWidget);
    expect(find.textContaining('jours'), findsOneWidget);
    expect(find.text('Réf. R7KQ2M'), findsOneWidget);
  });

  testWidgets('une étape porte son numéro, son titre et son contenu', (tester) async {
    await pumpLocalized(
      tester,
      const Scaffold(
        body: BookingStep(number: 2, title: 'Le jour du dépôt', current: true, children: [Text('Prévenir de mon arrivée')]),
      ),
    );
    expect(find.text('2'), findsOneWidget);
    expect(find.text('Le jour du dépôt'), findsOneWidget);
    expect(find.text('Prévenir de mon arrivée'), findsOneWidget);
  });

  testWidgets('la carte orange propose de signer le contrat dans l\'appli, et rien sinon', (tester) async {
    locator.registerSingleton<PaperworkDataSource>(_Paperwork(true));
    await pumpLocalized(tester, const Scaffold(body: NextStepHero(reference: 'R7KQ2M')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('next-step-sign')), findsOneWidget);
    expect(find.textContaining('06 •• •• •• 78'), findsOneWidget);

    await locator.reset();
    locator.registerSingleton<PaperworkDataSource>(_Paperwork(false));
    await pumpLocalized(tester, const Scaffold(body: NextStepHero(key: Key('other'), reference: 'R7KQ2M')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('next-step')), findsNothing);
  });
}

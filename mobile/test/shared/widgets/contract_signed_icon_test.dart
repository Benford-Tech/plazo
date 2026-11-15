import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/shared/widgets/contract_signed_icon.dart';

import '../../helpers/pump_app.dart';

/// 15/11/2026 (« avoir une indication des contrats déjà signés », choix C): the small icon beside the name.
void main() {
  setUpAll(setUpLocalizedTests);

  testWidgets('un contrat signé montre l’icône et dit quand', (tester) async {
    final semantics = tester.ensureSemantics();
    await pumpLocalized(tester, Scaffold(body: Center(child: ContractSignedIcon(signedAt: DateTime(2026, 11, 15, 8, 32)))));
    expect(find.byIcon(Icons.assignment_turned_in_rounded), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp(r'^Contrat signé · 15 nov\.')), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('rien tant que le contrat n’est pas signé', (tester) async {
    await pumpLocalized(tester, const Scaffold(body: Center(child: ContractSignedIcon(signedAt: null))));
    expect(find.byIcon(Icons.assignment_turned_in_rounded), findsNothing);
  });
}

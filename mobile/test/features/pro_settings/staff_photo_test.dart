import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_settings/data/staff_photo_data_source.dart';
import 'package:parking_app/src/features/pro_settings/presentation/widgets/staff_photo_card.dart';

import '../../helpers/paperwork.dart';
import '../../helpers/pump_app.dart';

// « Ma photo » dans Plazo Pro (30/10/2026, « ajoute la photo dans Plazo Pro »).
void main() {
  late FakeStaffPhoto photo;

  setUpAll(setUpLocalizedTests);
  setUp(() {
    photo = FakeStaffPhoto();
    if (locator.isRegistered<StaffPhotoDataSource>()) locator.unregister<StaffPhotoDataSource>();
    locator.registerSingleton<StaffPhotoDataSource>(photo);
  });

  Future<void> pumpCard(WidgetTester tester) async {
    await pumpLocalized(tester, const Scaffold(body: StaffPhotoCard(staffId: 'st1', name: 'Joanny Simporé')));
    await tester.pumpAndSettle();
  }

  testWidgets('sans photo : les initiales et « Choisir une photo »', (tester) async {
    await pumpCard(tester);
    expect(find.text('JS'), findsOneWidget);
    expect(find.text('Choisir une photo'), findsOneWidget);
    expect(find.text('Prendre une photo'), findsOneWidget);
    expect(find.byKey(const Key('account-photo-remove')), findsNothing);
  });

  testWidgets('avec une photo : « Changer ma photo » et « Retirer »', (tester) async {
    photo.photoUpdatedAt = DateTime.utc(2026, 10, 30, 8);
    await pumpCard(tester);
    expect(find.text('Changer ma photo'), findsOneWidget);
    await tester.tap(find.byKey(const Key('account-photo-remove')));
    await tester.pumpAndSettle();
    expect(photo.removals, 1);
    expect(find.text('Photo retirée.'), findsOneWidget);
    expect(find.text('Choisir une photo'), findsOneWidget);
  });

  testWidgets('dans la démo, la photo ne se change pas', (tester) async {
    photo.demo = true;
    await pumpCard(tester);
    expect(find.text('Démo : la photo ne se change pas.'), findsOneWidget);
    expect(find.byKey(const Key('account-photo-gallery')), findsNothing);
  });

  test('les initiales du nom', () {
    expect(initialsOf('Joanny Simporé'), 'JS');
    expect(initialsOf('Karim'), 'K');
    expect(initialsOf('  '), '?');
  });
}

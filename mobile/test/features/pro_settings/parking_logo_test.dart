import 'dart:typed_data';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_settings/data/operator_logo_data_source.dart';
import 'package:parking_app/src/features/pro_settings/presentation/widgets/parking_logo_section.dart';
import 'package:parking_app/src/shared/widgets/brand_header.dart';

import '../../helpers/pump_app.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// A 1×1 transparent PNG.
final _png = Uint8List.fromList([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, //
  0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

class FakeLogo implements OperatorLogoDataSource {
  int removals = 0;
  final loads = <DateTime>[];
  @override
  Future<Uint8List?> load(DateTime updatedAt) async {
    loads.add(updatedAt);
    return _png;
  }

  @override
  Future<void> remove() async => removals++;

  @override
  Future<DateTime?> upload(Uint8List bytes, {required String contentType}) async => DateTime.utc(2026, 11, 2, 16);
}

// « Pouvoir personnaliser Plazo avec l'icône du parking » (02/11/2026, direction B).
void main() {
  late FakeLogo logo;

  setUpAll(setUpLocalizedTests);
  setUp(() {
    logo = FakeLogo();
    if (locator.isRegistered<OperatorLogoDataSource>()) locator.unregister<OperatorLogoDataSource>();
    locator.registerSingleton<OperatorLogoDataSource>(logo);
  });

  MockAuthBloc authWith(DateTime? at) {
    final auth = MockAuthBloc();
    final staff = StaffModel(
      id: 's1',
      name: 'Joanny S',
      email: 'j@example.com',
      role: 'manager',
      operatorName: 'Parking des Cèdres',
      operatorLogoUpdatedAt: at,
    );
    whenListen(
      auth,
      const Stream<ProAuthState>.empty(),
      initialState: ProAuthState(status: ProAuthStatus.signedIn, staff: staff),
    );
    return auth;
  }

  testWidgets('la barre de Plazo Pro montre le logo du parking à côté du panneau', (tester) async {
    final at = DateTime.utc(2026, 11, 2, 15);
    await pumpLocalized(
      tester,
      BlocProvider<ProAuthBloc>.value(
        value: authWith(at),
        child: const Scaffold(appBar: BrandAppBar(pro: true)),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('parking-logo')), findsOneWidget);
    expect(logo.loads, [at]);
  });

  testWidgets('sans logo, la barre reste Plazo Pro seul', (tester) async {
    await pumpLocalized(
      tester,
      BlocProvider<ProAuthBloc>.value(
        value: authWith(null),
        child: const Scaffold(appBar: BrandAppBar(pro: true)),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('parking-logo')), findsNothing);
    expect(logo.loads, isEmpty);
  });

  testWidgets('Réglages du parking : retirer le logo', (tester) async {
    final auth = authWith(DateTime.utc(2026, 11, 2, 15));
    await pumpLocalized(
      tester,
      BlocProvider<ProAuthBloc>.value(
        value: auth,
        child: const Scaffold(body: ParkingLogoSection()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Changer le logo'), findsOneWidget);
    await tester.tap(find.byKey(const Key('settings-logo-remove')));
    await tester.pumpAndSettle();
    expect(logo.removals, 1);
    expect(find.text('Logo retiré.'), findsOneWidget);
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_settings/data/datasources/settings_data_source.dart';
import 'package:parking_app/src/features/pro_settings/data/models/settings_models.dart';
import 'package:parking_app/src/features/pro_settings/domain/usecases/settings_use_cases.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_settings_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_parking_settings_page.dart';

import '../../helpers/pump_app.dart';

class MockGetParking extends Mock implements GetParkingSettingsUseCase {}

class MockUpdateParking extends Mock implements UpdateParkingSettingsUseCase {}

class MockGetSms extends Mock implements GetSmsSettingsUseCase {}

class MockGetStatus extends Mock implements GetSmsStatusUseCase {}

class MockSaveSms extends Mock implements SaveSmsSettingsUseCase {}

class MockTestSms extends Mock implements TestSmsUseCase {}

class MockDisableSms extends Mock implements DisableSmsUseCase {}

class MockChangePassword extends Mock implements ChangePasswordUseCase {}

class MockSetTracking extends Mock implements SetShuttleTrackingUseCase {}

void main() {
  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const UpdateParkingParams(id: '', input: ParkingSettingsInput(name: '', totalCapacity: 0, safetyMarginPct: 0, shuttleTravelMinutes: 0)));
    return setUpLocalizedTests();
  });

  late MockGetParking getParking;
  late MockUpdateParking updateParking;
  late MockGetSms getSms;
  late MockGetStatus getStatus;

  setUp(() {
    getParking = MockGetParking();
    updateParking = MockUpdateParking();
    getSms = MockGetSms();
    getStatus = MockGetStatus();
    when(() => getSms(any())).thenAnswer((_) async => const Right(SmsSettingsModel(mode: 'none')));
    when(() => getStatus(any())).thenAnswer((_) async => const Right(SmsStatusModel(mode: 'none')));
  });

  Future<void> pumpPage(WidgetTester tester, ParkingSettingsModel parking) async {
    when(() => getParking(any())).thenAnswer((_) async => Right(parking));
    when(() => updateParking(any())).thenAnswer((_) async => Right(parking));
    final bloc = ProSettingsBloc(
      getParking,
      updateParking,
      getSms,
      getStatus,
      MockSaveSms(),
      MockTestSms(),
      MockDisableSms(),
      MockChangePassword(),
      MockSetTracking(),
    )..add(const ProSettingsStarted());
    addTearDown(bloc.close);
    await pumpLocalized(tester, BlocProvider.value(value: bloc, child: const ProParkingSettingsPage()));
    await tester.pump();
  }

  testWidgets('avec des files, le nombre de places vient du plan, en lecture seule ; le chiffre déclaré repart tel quel', (tester) async {
    await pumpPage(
      tester,
      const ParkingSettingsModel(id: 'p1', name: 'Parkair', totalCapacity: 150, safetyMarginPct: 10, effectiveCapacity: 64, capacitySource: 'files'),
    );
    expect(find.byKey(const Key('set-capacity')), findsNothing);
    expect(find.byKey(const Key('set-capacity-plan')), findsOneWidget);
    expect(find.text('64 places'), findsOneWidget);
    expect(
      find.text("Calculé depuis le plan du parking (files de voiturier) : c'est ce nombre qui compte partout (réservations, site, planning)."),
      findsOneWidget,
    );
    expect(find.byKey(const Key('set-open-plan')), findsOneWidget);
    // The margin applies to the plan's figure: 64 − 10 % = 57.
    expect(find.text('Places réservables avec ces réglages : 57'), findsOneWidget);

    await tester.ensureVisible(find.byKey(const Key('set-save')));
    await tester.pump(const Duration(milliseconds: 500));
    await tester.tap(find.byKey(const Key('set-save')));
    await tester.pump();
    final params = verify(() => updateParking(captureAny())).captured.single as UpdateParkingParams;
    expect(params.input.totalCapacity, 150);
  });

  testWidgets('avec des places générées, dit qu’elles viennent du plan', (tester) async {
    await pumpPage(
      tester,
      const ParkingSettingsModel(id: 'p1', name: 'Parkair', totalCapacity: 150, effectiveCapacity: 1, capacitySource: 'spots'),
    );
    expect(find.text('1 place'), findsOneWidget);
    expect(find.textContaining('(places du plan)'), findsOneWidget);
  });

  testWidgets('sans plan (ou serveur plus ancien), le nombre de places se saisit', (tester) async {
    await pumpPage(tester, const ParkingSettingsModel(id: 'p1', name: 'Parkair', totalCapacity: 150, safetyMarginPct: 10));
    expect(find.byKey(const Key('set-capacity-plan')), findsNothing);
    expect(find.byKey(const Key('set-capacity')), findsOneWidget);
    expect(find.text('Places réservables avec ces réglages : 135'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('set-capacity')), '100');
    await tester.pump();
    expect(find.text('Places réservables avec ces réglages : 90'), findsOneWidget);
  });
}

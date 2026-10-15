import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/features/pro_notifications/data/models/notification_preferences_model.dart';
import 'package:parking_app/src/features/pro_notifications/presentation/bloc/pro_notifications_bloc.dart';
import 'package:parking_app/src/features/pro_notifications/presentation/pages/pro_notifications_page.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockNotificationsBloc extends MockBloc<ProNotificationsEvent, ProNotificationsState> implements ProNotificationsBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): « Notifications », pushed above the shell, keeps « Activer les
/// notifications sur ce téléphone » and the phones line above the navigation bar, and its switches clear of a side bar in
/// landscape.
void main() {
  setUpAll(setUpLocalizedTests);

  Future<void> show(WidgetTester tester, {required Size size}) async {
    final bloc = MockNotificationsBloc();
    whenListen(
      bloc,
      const Stream<ProNotificationsState>.empty(),
      initialState: const ProNotificationsState(
        viewState: ViewState.success,
        pushSupported: true,
        preferences: NotificationPreferencesModel(arrivals: true, returns: true, devices: 2),
      ),
    );
    await pumpLocalized(tester, BlocProvider<ProNotificationsBloc>.value(value: bloc, child: const ProNotificationsPage()), size: size);
  }

  testWidgets('en fin de page, « Activer les notifications » et les téléphones enregistrés restent au-dessus de la barre', (tester) async {
    setSystemBars(tester);
    await show(tester, size: const Size(400, 700));
    final position = tester.state<ScrollableState>(find.byType(Scrollable).first).position;
    expect(position.maxScrollExtent, greaterThan(0));
    for (var i = 0; i < 10 && position.pixels != position.maxScrollExtent; i++) {
      position.jumpTo(position.maxScrollExtent);
      await tester.pump();
    }
    expectClearOfSystemBars(tester, find.text('Activer les notifications sur ce téléphone'));
    expectClearOfSystemBars(tester, find.text('Téléphones enregistrés : 2'));
  });

  testWidgets('paysage : les interrupteurs s\'écartent de l\'encoche et de la barre de navigation sur le côté', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await show(tester, size: const Size(800, 400));
    expectClearOfSystemBars(tester, find.byKey(const Key('notify-arrivals')));
  });
}

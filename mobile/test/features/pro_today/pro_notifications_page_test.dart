import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/features/pro_notifications/data/models/notification_preferences_model.dart';
import 'package:parking_app/src/features/pro_notifications/presentation/bloc/pro_notifications_bloc.dart';
import 'package:parking_app/src/features/pro_notifications/presentation/pages/pro_notifications_page.dart';

import '../../helpers/pump_app.dart';

class MockNotificationsBloc extends MockBloc<ProNotificationsEvent, ProNotificationsState> implements ProNotificationsBloc {}

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ProNotificationsLoaded());
  });

  const prefs = NotificationPreferencesModel(arrivals: true, returns: true, devices: 1);

  testWidgets('N-A · « Nouvelles réservations » : trois choix, « Toutes les heures » envoie bookings: hourly', (tester) async {
    final bloc = MockNotificationsBloc();
    whenListen(bloc, const Stream<ProNotificationsState>.empty(), initialState: const ProNotificationsState(viewState: ViewState.success, preferences: prefs));
    await pumpLocalized(tester, BlocProvider<ProNotificationsBloc>.value(value: bloc, child: const ProNotificationsPage()));
    await tester.pumpAndSettle();
    expect(find.text('Nouvelles réservations'), findsOneWidget);
    expect(find.textContaining('jamais entre 22 h et 7 h'), findsOneWidget);
    expect(find.text('À chaque réservation'), findsOneWidget);
    expect(find.text('Toutes les heures'), findsOneWidget);
    expect(find.text('Jamais'), findsOneWidget);
    expect(find.byKey(const Key('notify-bookings')), findsNothing);

    // The current choice sends nothing again.
    await tester.tap(find.byKey(const Key('notify-bookings-immediate')));
    await tester.pump();
    verifyNever(() => bloc.add(any()));

    await tester.tap(find.byKey(const Key('notify-bookings-hourly')));
    await tester.pump();
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ProNotificationsToggled>().having((e) => e.bookings, 'bookings', 'hourly'));
  });

  testWidgets('N-A · le choix enregistré (« Jamais ») est coché', (tester) async {
    final bloc = MockNotificationsBloc();
    whenListen(
      bloc,
      const Stream<ProNotificationsState>.empty(),
      initialState: ProNotificationsState(viewState: ViewState.success, preferences: prefs.copyWith(bookings: 'never')),
    );
    await pumpLocalized(tester, BlocProvider<ProNotificationsBloc>.value(value: bloc, child: const ProNotificationsPage()));
    await tester.pumpAndSettle();
    final never = tester.widget<RadioListTile<String>>(find.byKey(const Key('notify-bookings-never')));
    expect(never.value, 'never');
    final group = tester.widget<RadioGroup<String>>(find.byType(RadioGroup<String>));
    expect(group.groupValue, 'never');
  });
}

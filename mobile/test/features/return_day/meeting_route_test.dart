import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/arrival/domain/usecases/at_meeting_point_use_case.dart';
import 'package:parking_app/src/features/return_day/domain/usecases/return_use_cases.dart';
import 'package:parking_app/src/features/return_day/presentation/bloc/meeting_route_bloc.dart';
import 'package:parking_app/src/features/return_day/presentation/pages/meeting_point_route_page.dart';
import 'package:parking_app/src/services/location_service.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/shared/widgets/ign_map.dart';

import '../../helpers/fakes.dart';
import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockGet extends Mock implements GetReturnUseCase {}

class MockRoute extends Mock implements GetWalkingRouteUseCase {}

class MockAtPoint extends Mock implements AtMeetingPointUseCase {}

class MockLocation extends Mock implements LocationService {}

class MockRouteBloc extends MockBloc<MeetingRouteEvent, MeetingRouteState> implements MeetingRouteBloc {}

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const WalkingRouteParams(reference: 'x'));
    registerFallbackValue(const AtMeetingPointParams(reference: 'x', kind: ArrivalKind.returnTrip));
    registerFallbackValue(const MeetingRouteOpened('x'));
    if (!locator.isRegistered<LinkService>()) locator.registerLazySingleton<LinkService>(FakeLinks.new);
  });

  group('MeetingRouteBloc', () {
    late MockGet get;
    late MockRoute route;
    late MockAtPoint atPoint;
    late MockLocation location;

    setUp(() {
      get = MockGet();
      route = MockRoute();
      atPoint = MockAtPoint();
      location = MockLocation();
      when(() => get(any())).thenAnswer((_) async => Right(travellerReturn(flight: landedFlight())));
      when(() => route(any())).thenAnswer((_) async => Right(walkingRoute()));
      when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.granted);
      when(() => location.current()).thenAnswer((_) async => position(45.722));
    });

    Future<void> settle() => Future<void>.delayed(Duration.zero).then((_) => Future<void>.delayed(Duration.zero));

    test('chemin calculé depuis la position du téléphone', () async {
      final bloc = MeetingRouteBloc(get, route, atPoint, location)..add(const MeetingRouteOpened('r7kq2m'));
      await settle();
      expect(bloc.state.loadState, ViewState.success);
      expect(bloc.state.fromMe, isTrue);
      expect(bloc.state.route?.durationMinutes, 6);
      final params = verify(() => route(captureAny())).captured.single as WalkingRouteParams;
      expect(params.from?.lat, 45.722);
      expect(bloc.state.data?.flight.terminal, '1');
      await bloc.close();
    });

    test('position refusée : chemin depuis le terminal ; service en panne : ligne droite signalée', () async {
      when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.denied);
      when(() => route(any())).thenAnswer((_) async => Right(walkingRoute(fallback: true)));
      final bloc = MeetingRouteBloc(get, route, atPoint, location)..add(const MeetingRouteOpened('R7KQ2M'));
      await settle();
      expect(bloc.state.fromMe, isFalse);
      expect(bloc.state.locationProblem, LocationAccess.denied);
      expect(bloc.state.route?.fallback, isTrue);
      verifyNever(() => location.current());
      expect((verify(() => route(captureAny())).captured.single as WalkingRouteParams).from, isNull);
      await bloc.close();
    });

    test('erreur réseau, puis « Je suis arrivé » envoie le signal retour', () async {
      when(() => route(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'x')));
      final bloc = MeetingRouteBloc(get, route, atPoint, location)..add(const MeetingRouteOpened('R7KQ2M'));
      await settle();
      expect(bloc.state.loadState, ViewState.error);
      when(() => atPoint(any())).thenAnswer((_) async => Right(arrival(kind: ArrivalKind.returnTrip, signal: signal(kind: ArrivalKind.returnTrip, state: ArrivalSignalState.atMeetingPoint))));
      bloc.add(const MeetingRouteArrived());
      await settle();
      expect(bloc.state.arrived, isTrue);
      verify(() => atPoint(const AtMeetingPointParams(reference: 'R7KQ2M', kind: ArrivalKind.returnTrip))).called(1);
      await bloc.close();
    });
  });

  group('MeetingPointRoutePage', () {
    late MockRouteBloc bloc;
    setUp(() => bloc = MockRouteBloc());

    Future<void> show(WidgetTester tester, MeetingRouteState state) async {
      whenListen(bloc, const Stream<MeetingRouteState>.empty(), initialState: state);
      await pumpLocalized(tester, BlocProvider<MeetingRouteBloc>.value(value: bloc, child: const MeetingPointRoutePage(reference: 'R7KQ2M')));
    }

    testWidgets('R2 · chemin chargé : carte, durée, distance, terminal, consignes numérotées, photo, bouton', (tester) async {
      await show(tester, MeetingRouteState(reference: 'R7KQ2M', loadState: ViewState.success, fromMe: true, data: travellerReturn(flight: landedFlight()), route: walkingRoute()));
      expect(find.byType(IgnMap), findsOneWidget);
      expect(find.text('6 min'), findsOneWidget);
      expect(find.text('450 m à pied'), findsOneWidget);
      expect(find.text('Terminal 1 · Porte 12'), findsWidgets);
      expect(find.text('1.'), findsOneWidget);
      expect(find.text('2.'), findsOneWidget);
      expect(find.text('Photo du point de rendez-vous'), findsOneWidget);
      expect(find.byKey(const Key('route-fallback')), findsNothing);
      expect(find.byKey(const Key('route-from-terminal')), findsNothing);
      expect(find.byKey(const Key('open-maps')), findsOneWidget);
      await tester.ensureVisible(find.byKey(const Key('route-arrived')));
      await tester.pump();
      await tester.tap(find.byKey(const Key('route-arrived')));
      expect(verify(() => bloc.add(captureAny())).captured.single, isA<MeetingRouteArrived>());
    });

    testWidgets('R2 · repli : ligne droite signalée, depuis le terminal', (tester) async {
      await show(tester, MeetingRouteState(reference: 'R7KQ2M', loadState: ViewState.success, fromMe: false, data: travellerReturn(), route: walkingRoute(fallback: true)));
      expect(find.byKey(const Key('route-fallback')), findsOneWidget);
      expect(find.byKey(const Key('route-from-terminal')), findsOneWidget);
    });
  });
}

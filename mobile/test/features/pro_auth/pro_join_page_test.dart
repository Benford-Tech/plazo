import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/onboarding_models.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/identity_use_cases.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_join_bloc.dart';
import 'package:parking_app/src/features/pro_auth/presentation/pages/pro_join_page.dart';
import 'package:parking_app/src/features/pro_auth/presentation/pages/pro_login_page.dart';

import '../../helpers/pump_app.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

class MockJoinBloc extends MockBloc<ProJoinEvent, ProJoinState> implements ProJoinBloc {}

class MockGet extends Mock implements GetOnboardingUseCase {}

class MockJoin extends Mock implements JoinParkingUseCase {}

class MockCancel extends Mock implements CancelJoinRequestUseCase {}

class MockOpen extends Mock implements OpenJoinedSessionUseCase {}

const identity = IdentityModel(provider: 'apple', email: 'julie.m@icloud.com', firstName: 'Julie', lastName: 'Martin');
final now = DateTime.now();
JoinRequestModel request(String status) => JoinRequestModel(
  id: 'jr1',
  status: status,
  operatorName: 'Parkair Lyon',
  firstName: 'Julie',
  lastName: 'Martin',
  wishedRole: 'driver',
  createdAt: DateTime(now.year, now.month, now.day, 9, 38).toUtc(),
  expiresAt: now.add(const Duration(days: 7)),
);

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ProJoinRefreshed());
    registerFallbackValue(const ProAuthLogoutRequested());
    registerFallbackValue(NoParams());
  });

  late MockAuthBloc auth;
  late MockJoinBloc join;

  setUp(() {
    auth = MockAuthBloc();
    join = MockJoinBloc();
  });

  Future<void> pumpJoin(WidgetTester tester, ProJoinState state, {ProAuthState? authState}) async {
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: authState ?? const ProAuthState(status: ProAuthStatus.onboarding));
    whenListen(join, const Stream<ProJoinState>.empty(), initialState: state);
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProAuthBloc>.value(value: auth),
          BlocProvider<ProJoinBloc>.value(value: join),
        ],
        child: const ProJoinPage(),
      ),
    );
    await tester.pumpAndSettle();
  }

  group('« Rejoindre un parking » (maquette 2, variante A)', () {
    testWidgets('connecté avec Apple, nom prérempli, le tiret s’ajoute seul, « Je suis » puis « Envoyer ma demande »', (tester) async {
      await pumpJoin(tester, const ProJoinState(identity: identity));
      expect(find.text('Rejoindre un parking'), findsOneWidget);
      expect(find.text('Connecté avec Apple · julie.m@icloud.com'), findsOneWidget);
      expect(find.text('CODE DU JOUR'), findsOneWidget);
      expect(find.text('Demandez-le à votre gérant. Il change chaque nuit à minuit.'), findsOneWidget);
      expect(tester.widget<TextField>(find.byKey(const Key('join-first-name'))).controller?.text, 'Julie');
      expect(tester.widget<TextField>(find.byKey(const Key('join-last-name'))).controller?.text, 'Martin');
      expect(find.text('Accueil'), findsOneWidget);
      expect(find.text('Chauffeur'), findsOneWidget);
      expect(find.text('Voiturier'), findsOneWidget);

      await tester.enterText(find.byKey(const Key('join-code')), 'k7qm2xp9td');
      await tester.pump();
      expect(tester.widget<TextField>(find.byKey(const Key('join-code'))).controller?.text, 'K7QM2-XP9TD');
      await tester.tap(find.byKey(const Key('join-post-driver')));
      await tester.pump();
      await tester.tap(find.byKey(const Key('join-submit')));
      final sent = verify(() => join.add(captureAny())).captured.whereType<ProJoinSubmitted>().single;
      expect(sent.code, 'K7QM2-XP9TD');
      expect(sent.firstName, 'Julie');
      expect(sent.wishedRole, 'driver');

      // « Utiliser un autre compte » ends the onboarding session.
      await tester.tap(find.byKey(const Key('join-other-account')));
      verify(() => auth.add(any(that: isA<ProAuthLogoutRequested>()))).called(1);
    });

    group('la vraie route (bloc réel, cas d’usage simulés)', () {
      late MockGet get;
      const onboarding = OnboardingModel(identity: identity);

      setUp(() {
        get = MockGet();
        // The API answers a little later than the first frame.
        when(() => get(any()))
            .thenAnswer((_) => Future.delayed(const Duration(milliseconds: 50), () => const Right<Failure, OnboardingModel>(onboarding)));
        whenListen(
          auth,
          const Stream<ProAuthState>.empty(),
          initialState: const ProAuthState(status: ProAuthStatus.onboarding, onboarding: onboarding),
        );
      });

      tearDown(() async {
        if (locator.isRegistered<ProJoinBloc>()) await locator.unregister<ProJoinBloc>();
      });

      testWidgets('wrappedRoute : le bloc part de la réponse de la connexion, Prénom et Nom préremplis dès la première image', (
        tester,
      ) async {
        // The API never answers here: only the sign-in's answer can fill the form.
        when(() => get(any())).thenAnswer((_) => Completer<Either<Failure, OnboardingModel>>().future);
        locator.registerFactoryParam<ProJoinBloc, OnboardingModel?, void>(
          (initial, _) => ProJoinBloc(get, MockJoin(), MockCancel(), MockOpen(), initial: initial),
        );
        await pumpLocalized(
          tester,
          BlocProvider<ProAuthBloc>.value(
            value: auth,
            child: Builder(builder: (context) => const ProJoinPage().wrappedRoute(context)),
          ),
        );
        expect(find.text('Connecté avec Apple · julie.m@icloud.com'), findsOneWidget);
        expect(tester.widget<TextField>(find.byKey(const Key('join-first-name'))).controller?.text, 'Julie');
        expect(tester.widget<TextField>(find.byKey(const Key('join-last-name'))).controller?.text, 'Martin');
      });

      testWidgets('identité arrivée après la première image (bloc non amorcé) : les champs vides se remplissent', (tester) async {
        final bloc = ProJoinBloc(get, MockJoin(), MockCancel(), MockOpen());
        addTearDown(bloc.close);
        await pumpLocalized(
          tester,
          MultiBlocProvider(
            providers: [
              BlocProvider<ProAuthBloc>.value(value: auth),
              BlocProvider<ProJoinBloc>.value(value: bloc..add(const ProJoinStarted())),
            ],
            child: const ProJoinPage(),
          ),
        );
        await tester.pumpAndSettle(const Duration(milliseconds: 100));
        expect(find.text('Connecté avec Apple · julie.m@icloud.com'), findsOneWidget);
        expect(tester.widget<TextField>(find.byKey(const Key('join-first-name'))).controller?.text, 'Julie');
        expect(tester.widget<TextField>(find.byKey(const Key('join-last-name'))).controller?.text, 'Martin');
      });
    });

    testWidgets('Apple sans nom (déjà autorisé une fois) : Prénom et Nom à remplir ; code faux : le message de la maquette', (
      tester,
    ) async {
      await pumpJoin(
        tester,
        const ProJoinState(
          identity: IdentityModel(provider: 'apple', email: 'x7k@privaterelay.appleid.com', isPrivateEmail: true),
          codeError: 'join_code_invalid',
          fieldErrors: {'firstName': 'required'},
        ),
      );
      expect(tester.widget<TextField>(find.byKey(const Key('join-first-name'))).controller?.text, '');
      expect(find.text("Ce code ne marche pas. Vérifiez-le, ou demandez celui d'aujourd'hui à votre gérant."), findsOneWidget);
      expect(find.text('Champ obligatoire.'), findsOneWidget);
    });

    testWidgets('trop d’essais, e-mail déjà pris : expliqués sous le formulaire', (tester) async {
      await pumpJoin(tester, const ProJoinState(identity: identity, errorCode: 'email_taken'));
      expect(find.textContaining('Masquer mon adresse e-mail'), findsOneWidget);
    });
  });

  group('l’attente et la réponse du gérant (maquette 3)', () {
    testWidgets('« Demande envoyée » : le parking en gras, le nom, le poste, l’heure ; « Annuler la demande »', (tester) async {
      await pumpJoin(tester, ProJoinState(identity: identity, request: request('pending')));
      expect(find.text('Demande envoyée'), findsOneWidget);
      expect(find.textContaining('Parkair Lyon', findRichText: true), findsOneWidget);
      expect(find.text('Julie Martin'), findsOneWidget);
      expect(find.text('Poste demandé'), findsOneWidget);
      expect(find.text('Chauffeur'), findsOneWidget);
      expect(find.text("aujourd'hui à 09:38"), findsOneWidget);
      await tester.tap(find.byKey(const Key('join-cancel')));
      verify(() => join.add(any(that: isA<ProJoinCancelRequested>()))).called(1);
    });

    testWidgets('inscription rétablie au démarrage, connexions de l’API pas encore lues : « Confirmer avec Apple » quand même', (
      tester,
    ) async {
      await pumpJoin(
        tester,
        ProJoinState(identity: identity, request: request('pending')),
        authState: const ProAuthState(status: ProAuthStatus.onboarding, deviceProviders: ProvidersModel(apple: true)),
      );
      await tester.tap(find.byKey(const Key('join-delete')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('delete-confirm-apple')), findsOneWidget);
      expect(find.text('Confirmer avec Apple'), findsOneWidget);
    });

    testWidgets('« Supprimer mon compte » avant d’avoir rejoint : confirmé par Apple sur l’iPhone', (tester) async {
      await pumpJoin(
        tester,
        ProJoinState(identity: identity, request: request('pending')),
        authState: const ProAuthState(status: ProAuthStatus.onboarding, providers: ProvidersModel(apple: true)),
      );
      await tester.tap(find.byKey(const Key('join-delete')));
      await tester.pumpAndSettle();
      expect(find.text('Supprimer votre compte ?'), findsOneWidget);
      expect(find.textContaining('votre identifiant Apple sera oublié'), findsOneWidget);
      await tester.tap(find.byKey(const Key('delete-confirm-apple')));
      await tester.pumpAndSettle();
      final event = verify(() => auth.add(captureAny())).captured.whereType<ProAuthDeleteRequested>().single;
      expect(event.provider, 'apple');
    });

    testWidgets('refusée : « Demande refusée », « Taper un nouveau code »', (tester) async {
      await pumpJoin(tester, ProJoinState(identity: identity, request: request('refused')));
      expect(find.text('Demande refusée'), findsOneWidget);
      expect(find.textContaining("n'a pas accepté votre demande", findRichText: true), findsOneWidget);
      await tester.tap(find.byKey(const Key('join-new-code')));
      verify(() => join.add(any(that: isA<ProJoinNewCodeRequested>()))).called(1);
    });

    testWidgets('expirée après 7 jours', (tester) async {
      await pumpJoin(tester, ProJoinState(identity: identity, request: request('expired')));
      expect(find.text('Demande expirée'), findsOneWidget);
    });
  });

  group('connexion (maquette 1)', () {
    Future<void> pumpLogin(WidgetTester tester, ProAuthState state) async {
      whenListen(auth, const Stream<ProAuthState>.empty(), initialState: state);
      await pumpLocalized(tester, BlocProvider<ProAuthBloc>.value(value: auth, child: const ProLoginPage()));
      await tester.pumpAndSettle();
    }

    testWidgets('iPhone (choix B) : l’e-mail d’abord, « Continuer avec Apple » dessous', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut, providers: ProvidersModel(apple: true)));
      expect(find.text("Le parking, de l'arrivée au retour."), findsOneWidget);
      expect(find.text('Votre adresse e-mail'), findsOneWidget);
      expect(find.byKey(const Key('pro-email')), findsOneWidget);
      expect(find.byKey(const Key('pro-password')), findsNothing);
      expect(find.byKey(const Key('pro-login-apple')), findsOneWidget);
      expect(find.byKey(const Key('pro-login-google')), findsNothing);
      expect(find.text('ou'), findsOneWidget);
      await tester.tap(find.byKey(const Key('pro-login-apple')));
      final events = verify(() => auth.add(captureAny())).captured;
      expect(events.whereType<ProAuthProvidersRequested>(), hasLength(1));
      expect(events.whereType<ProAuthProviderSignInRequested>().single.provider, 'apple');
    });

    testWidgets('choix B : un champ à la fois, puis la connexion', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut));
      // An address without @ stays on the first step.
      await tester.enterText(find.byKey(const Key('pro-email')), 'karim');
      await tester.tap(find.byKey(const Key('pro-login-next')));
      await tester.pumpAndSettle();
      expect(find.text('Adresse e-mail invalide.'), findsOneWidget);
      expect(find.byKey(const Key('pro-password')), findsNothing);

      await tester.enterText(find.byKey(const Key('pro-email')), ' karim@parking.fr ');
      await tester.tap(find.byKey(const Key('pro-login-next')));
      await tester.pumpAndSettle();
      expect(find.text('Votre mot de passe'), findsOneWidget);
      expect(find.text('karim@parking.fr'), findsOneWidget);
      expect(find.text('Mot de passe perdu ? Votre gérant peut vous en donner un nouveau.'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('pro-password')), 'secret-1');
      await tester.tap(find.byKey(const Key('pro-login')));
      final login = verify(() => auth.add(captureAny())).captured.whereType<ProAuthLoginSubmitted>().single;
      expect(login.email, 'karim@parking.fr');
      expect(login.password, 'secret-1');

      // « Changer d'adresse e-mail » goes back, the address kept.
      await tester.tap(find.byKey(const Key('pro-login-back')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('pro-email')), findsOneWidget);
      expect(find.text(' karim@parking.fr '), findsOneWidget);
    });

    testWidgets('« Nouveau ? J’ai un code du jour » explique comment rejoindre un parking', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut, providers: ProvidersModel(google: true)));
      await tester.tap(find.byKey(const Key('pro-login-newcomer')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('pro-login-newcomer-sheet')), findsOneWidget);
      expect(find.text("Nouveau dans l'équipe ?"), findsOneWidget);
      expect(find.textContaining('Continuez avec Apple ou Google'), findsOneWidget);
      await tester.tap(find.text('Compris'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('pro-login-newcomer-sheet')), findsNothing);
    });

    testWidgets('Android : « Continuer avec Google », bouton blanc', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut, providers: ProvidersModel(google: true)));
      expect(find.byKey(const Key('pro-login-google')), findsOneWidget);
      expect(find.text('Continuer avec Google'), findsOneWidget);
      expect(find.byKey(const Key('pro-login-apple')), findsNothing);
    });

    testWidgets('web ou build sans réglage : l’e-mail seul, sans « ou »', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut));
      expect(find.byKey(const Key('pro-login-apple')), findsNothing);
      expect(find.byKey(const Key('pro-login-google')), findsNothing);
      expect(find.text('ou'), findsNothing);
      expect(find.byKey(const Key('pro-login-next')), findsOneWidget);
    });

    testWidgets('choix B : tient sur un petit téléphone, avec Apple et le lien des nouveaux', (tester) async {
      tester.view.physicalSize = const Size(320 * 2, 568 * 2);
      tester.view.devicePixelRatio = 2;
      addTearDown(tester.view.reset);
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut, providers: ProvidersModel(apple: true)));
      expect(tester.takeException(), isNull);
      await tester.dragUntilVisible(find.byKey(const Key('pro-login-newcomer')), find.byType(SingleChildScrollView), const Offset(0, -200));
      expect(find.text("Nouveau ? J'ai un code du jour"), findsOneWidget);
    });
  });
}

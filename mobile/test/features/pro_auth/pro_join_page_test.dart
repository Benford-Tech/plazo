import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/features/pro_auth/data/models/onboarding_models.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_join_bloc.dart';
import 'package:parking_app/src/features/pro_auth/presentation/pages/pro_join_page.dart';
import 'package:parking_app/src/features/pro_auth/presentation/pages/pro_login_page.dart';

import '../../helpers/pump_app.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

class MockJoinBloc extends MockBloc<ProJoinEvent, ProJoinState> implements ProJoinBloc {}

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

    testWidgets('Apple sans nom (déjà autorisé une fois) : Prénom et Nom à remplir ; code faux : le message de la maquette', (tester) async {
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

    testWidgets('iPhone : « Continuer avec Apple » en premier, l’e-mail dessous', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut, providers: ProvidersModel(apple: true)));
      expect(find.text('Connectez-vous, puis rejoignez votre parking avec le code du jour.'), findsOneWidget);
      expect(find.byKey(const Key('pro-login-apple')), findsOneWidget);
      expect(find.byKey(const Key('pro-login-google')), findsNothing);
      expect(find.text('ou avec votre e-mail'), findsOneWidget);
      expect(find.text('Mot de passe perdu ? Votre gérant peut vous en donner un nouveau.'), findsOneWidget);
      await tester.tap(find.byKey(const Key('pro-login-apple')));
      final events = verify(() => auth.add(captureAny())).captured;
      expect(events.whereType<ProAuthProvidersRequested>(), hasLength(1));
      expect(events.whereType<ProAuthProviderSignInRequested>().single.provider, 'apple');
    });

    testWidgets('Android : « Continuer avec Google », bouton blanc', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut, providers: ProvidersModel(google: true)));
      expect(find.byKey(const Key('pro-login-google')), findsOneWidget);
      expect(find.text('Continuer avec Google'), findsOneWidget);
      expect(find.byKey(const Key('pro-login-apple')), findsNothing);
    });

    testWidgets('web ou build sans réglage : le formulaire seul, comme avant', (tester) async {
      await pumpLogin(tester, const ProAuthState(status: ProAuthStatus.signedOut));
      expect(find.byKey(const Key('pro-login-apple')), findsNothing);
      expect(find.byKey(const Key('pro-login-google')), findsNothing);
      expect(find.text('ou avec votre e-mail'), findsNothing);
      expect(find.byKey(const Key('pro-login')), findsOneWidget);
    });
  });
}

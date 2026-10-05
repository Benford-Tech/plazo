import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/networking/networking.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/login_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/logout_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/restore_session_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/set_post_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/set_vehicle_use_case.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_notifications/data/models/notification_preferences_model.dart';
import 'package:parking_app/src/features/pro_notifications/domain/usecases/enable_push_use_case.dart';
import 'package:parking_app/src/features/pro_notifications/domain/usecases/get_notification_preferences_use_case.dart';
import 'package:parking_app/src/features/pro_notifications/domain/usecases/update_notification_preferences_use_case.dart';
import 'package:parking_app/src/features/pro_notifications/presentation/bloc/pro_notifications_bloc.dart';

class MockLogin extends Mock implements LoginUseCase {}

class MockRestore extends Mock implements RestoreSessionUseCase {}

class MockLogout extends Mock implements LogoutUseCase {}

class MockSetPost extends Mock implements SetPostUseCase {}

class MockSetVehicle extends Mock implements SetVehicleUseCase {}

class MockGetPrefs extends Mock implements GetNotificationPreferencesUseCase {}

class MockUpdatePrefs extends Mock implements UpdateNotificationPreferencesUseCase {}

class MockEnablePush extends Mock implements EnablePushUseCase {}

const staff = StaffModel(id: 'st1', name: 'Gérant', email: 'gerant@example.com', role: 'manager', operatorName: 'Parking Démo');
Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 1));

void main() {
  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const LoginParams(email: '', password: ''));
    registerFallbackValue(const PreferencesPatch());
  });

  group('session du personnel', () {
    test('connexion, puis fin de session quand le renouvellement est refusé', () async {
      final login = MockLogin();
      final session = SessionEvents();
      when(() => login(any())).thenAnswer((_) async => const Right(staff));
      final bloc = ProAuthBloc(login, MockRestore(), MockLogout(), MockSetPost(), MockSetVehicle(), session);
      bloc.add(const ProAuthLoginSubmitted(email: 'gerant@example.com', password: 'secret'));
      await settle();
      expect(bloc.state.status, ProAuthStatus.signedIn);
      session.notifyExpired();
      await settle();
      expect(bloc.state.status, ProAuthStatus.signedOut);
      expect(bloc.state.errorCode, 'session_expired');
      await bloc.close();
    });

    test('identifiants refusés : code d’erreur pour l’écran', () async {
      final login = MockLogin();
      when(() => login(any())).thenAnswer((_) async => const Left(ServerFailure(code: 'invalid_credentials', statusCode: 401)));
      final bloc = ProAuthBloc(login, MockRestore(), MockLogout(), MockSetPost(), MockSetVehicle(), SessionEvents());
      bloc.add(const ProAuthLoginSubmitted(email: 'x@example.com', password: 'bad'));
      await settle();
      expect(bloc.state.errorCode, 'invalid_credentials');
      expect(bloc.state.status, isNot(ProAuthStatus.signedIn));
      await bloc.close();
    });
  });

  group('réglages des notifications', () {
    test('basculer « Retours » ; revient en arrière si l’API refuse', () async {
      final get = MockGetPrefs();
      final update = MockUpdatePrefs();
      final enable = MockEnablePush();
      when(() => enable.supported).thenReturn(false);
      when(() => get(any())).thenAnswer((_) async => const Right(NotificationPreferencesModel(arrivals: true, returns: true, devices: 1)));
      when(() => update(any())).thenAnswer((_) async => const Right(NotificationPreferencesModel(arrivals: true, returns: false, devices: 1)));
      final bloc = ProNotificationsBloc(get, update, enable)..add(const ProNotificationsLoaded());
      await settle();
      expect(bloc.state.pushSupported, isFalse);
      bloc.add(const ProNotificationsToggled(returns: false));
      await settle();
      expect(bloc.state.preferences!.returns, isFalse);
      verify(() => update(const PreferencesPatch(returns: false))).called(1);

      when(() => update(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'Erreur', code: 'generic')));
      bloc.add(const ProNotificationsToggled(arrivals: false));
      await settle();
      expect(bloc.state.preferences!.arrivals, isTrue);
      await bloc.close();
    });
  });

  test('R-C · poste du jour : enregistré sur le compte, refusé hors du rôle', () async {
    final setPost = MockSetPost();
    final login = MockLogin();
    when(() => login(any())).thenAnswer((_) async => const Right(staff));
    when(() => setPost('driver')).thenAnswer((_) async => Right(staff.copyWith(post: 'driver', effectivePost: 'driver')));
    when(() => setPost('manager')).thenAnswer((_) async => const Left(ServerFailure(code: 'post_not_allowed', statusCode: 422)));
    final bloc = ProAuthBloc(login, MockRestore(), MockLogout(), setPost, MockSetVehicle(), SessionEvents());
    bloc.add(const ProAuthLoginSubmitted(email: 'gerant@example.com', password: 'secret'));
    await settle();
    bloc.add(const ProAuthPostChosen('driver'));
    await settle();
    expect(bloc.state.staff?.activePost, 'driver');
    bloc.add(const ProAuthPostChosen('manager'));
    await settle();
    expect(bloc.state.errorCode, 'post_not_allowed');
    expect(bloc.state.staff?.activePost, 'driver');
    await bloc.close();
  });
}

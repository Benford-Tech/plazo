import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_settings/data/datasources/settings_data_source.dart';
import 'package:parking_app/src/features/pro_settings/data/models/settings_models.dart';
import 'package:parking_app/src/features/pro_settings/domain/usecases/settings_use_cases.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_settings_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_team_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_parking_settings_page.dart';

class MockGetTeam extends Mock implements GetTeamUseCase {}

class MockCreate extends Mock implements CreateStaffUseCase {}

class MockUpdate extends Mock implements UpdateStaffUseCase {}

class MockReset extends Mock implements ResetStaffPasswordUseCase {}

class MockGetParking extends Mock implements GetParkingSettingsUseCase {}

class MockUpdateParking extends Mock implements UpdateParkingSettingsUseCase {}

class MockGetSms extends Mock implements GetSmsSettingsUseCase {}

class MockGetStatus extends Mock implements GetSmsStatusUseCase {}

class MockSaveSms extends Mock implements SaveSmsSettingsUseCase {}

class MockTestSms extends Mock implements TestSmsUseCase {}

class MockDisableSms extends Mock implements DisableSmsUseCase {}

class MockChangePassword extends Mock implements ChangePasswordUseCase {}

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 2));

const alex = TeamMemberModel(id: 's1', email: 'alex@demo.fr', name: 'Alex Agent', role: 'agent');
const parking = ParkingSettingsModel(id: 'p1', name: 'Parkair', totalCapacity: 150, safetyMarginPct: 10, shuttleTravelMinutes: 8, bookableCapacity: 135);

void main() {
  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const NewStaffParams(name: '', email: '', role: 'agent', password: ''));
    registerFallbackValue(const UpdateStaffParams(id: ''));
    registerFallbackValue(const ResetPasswordParams(id: '', password: ''));
    registerFallbackValue(const UpdateParkingParams(id: '', input: ParkingSettingsInput(name: '', totalCapacity: 0, safetyMarginPct: 0, shuttleTravelMinutes: 0)));
    registerFallbackValue(const SmsSettingsInput(mode: 'none'));
    registerFallbackValue(const ChangePasswordParams(currentPassword: '', newPassword: ''));
  });

  group('équipe', () {
    test('liste, crée, change le rôle, désactive ; une erreur de champ reste sur le champ', () async {
      final get = MockGetTeam();
      final create = MockCreate();
      final update = MockUpdate();
      final reset = MockReset();
      when(() => get(any())).thenAnswer((_) async => const Right([alex]));
      when(() => create(any())).thenAnswer((_) async => const Right(TeamMemberModel(id: 's2', email: 'd@demo.fr', name: 'Dan Driver', role: 'driver')));
      when(() => update(any())).thenAnswer((_) async => const Right(TeamMemberModel(id: 's1', email: 'alex@demo.fr', name: 'Alex Agent', role: 'manager', isActive: false)));
      when(() => reset(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation', fields: {'password': 'password_too_short'})));
      final b = ProTeamBloc(get, create, update, reset)..add(const ProTeamStarted());
      await settle();
      expect(b.state.members.map((m) => m.name), ['Alex Agent']);
      b.add(const ProTeamMemberCreated(NewStaffParams(name: 'Dan Driver', email: 'd@demo.fr', role: 'driver', password: 'mot-de-passe-solide')));
      await settle();
      expect(b.state.members, hasLength(2));
      expect(b.state.notice, 'team.created');
      b.add(const ProTeamMemberUpdated(UpdateStaffParams(id: 's1', isActive: false)));
      await settle();
      expect(b.state.members.first.isActive, isFalse);
      b.add(const ProTeamPasswordReset(ResetPasswordParams(id: 's1', password: 'court')));
      await settle();
      expect(b.state.fieldErrors, {'password': 'password_too_short'});
      expect(b.state.errorCode, isNull);
    });
  });

  group('réglages', () {
    late MockGetParking getParking;
    late MockUpdateParking updateParking;
    late MockGetSms getSms;
    late MockGetStatus getStatus;
    late MockSaveSms saveSms;
    late MockTestSms testSms;
    late MockDisableSms disableSms;
    late MockChangePassword changePassword;

    setUp(() {
      getParking = MockGetParking();
      updateParking = MockUpdateParking();
      getSms = MockGetSms();
      getStatus = MockGetStatus();
      saveSms = MockSaveSms();
      testSms = MockTestSms();
      disableSms = MockDisableSms();
      changePassword = MockChangePassword();
      when(() => getParking(any())).thenAnswer((_) async => const Right(parking));
      when(() => getSms(any())).thenAnswer((_) async => const Right(SmsSettingsModel(mode: 'none')));
      when(() => getStatus(any())).thenAnswer((_) async => const Right(SmsStatusModel(mode: 'none')));
    });

    ProSettingsBloc bloc() => ProSettingsBloc(getParking, updateParking, getSms, getStatus, saveSms, testSms, disableSms, changePassword);

    test('charge le parking et le canal SMS, enregistre le parking', () async {
      when(() => updateParking(any())).thenAnswer((_) async => const Right(ParkingSettingsModel(id: 'p1', name: 'Parkair Lyon', totalCapacity: 160, safetyMarginPct: 10, shuttleTravelMinutes: 9, bookableCapacity: 144)));
      final b = bloc()..add(const ProSettingsStarted());
      await settle();
      expect(b.state.parking?.name, 'Parkair');
      expect(b.state.sms?.mode, 'none');
      b.add(const ProSettingsParkingSaved(ParkingSettingsInput(name: 'Parkair Lyon', totalCapacity: 160, safetyMarginPct: 10, shuttleTravelMinutes: 9)));
      await settle();
      expect(b.state.parking?.bookableCapacity, 144);
      expect(b.state.notice, 'settings.saved');
      final params = verify(() => updateParking(captureAny())).captured.single as UpdateParkingParams;
      expect(params.input.toBody(), {'name': 'Parkair Lyon', 'address': null, 'totalCapacity': 160, 'safetyMarginPct': 10, 'shuttleTravelMinutes': 9, 'terminalLeadMinutes': 120, 'landingDelayMinutes': 30});
      expect(bookablePreview(160, 10), 144);
    });

    test('relie le téléphone, envoie le SMS de test puis relit l’état ; désactive', () async {
      when(() => saveSms(any())).thenAnswer((_) async => const Right(SmsSettingsModel(mode: 'gateway', gateway: SmsGatewayModel(login: 'AB12CD', senderPhone: '+33612345678'))));
      when(() => testSms('+33699999999')).thenAnswer((_) async => const Right(SmsTestModel(outcome: 'queued')));
      when(() => disableSms(any())).thenAnswer((_) async => const Right(SmsSettingsModel(mode: 'none')));
      final b = bloc()..add(const ProSettingsStarted());
      await settle();
      b.add(const ProSettingsSmsSaved(SmsSettingsInput(mode: 'gateway', login: 'AB12CD', password: 'secret', senderPhone: '+33612345678'), testTo: '+33699999999'));
      await settle();
      expect(b.state.sms?.gateway?.login, 'AB12CD');
      expect(b.state.notice, 'sms.test_queued:+33699999999');
      final input = verify(() => saveSms(captureAny())).captured.single as SmsSettingsInput;
      expect(input.toBody(), {'mode': 'gateway', 'login': 'AB12CD', 'password': 'secret', 'senderPhone': '+33612345678', 'baseUrl': null});
      verify(() => getStatus(any())).called(2);
      b.add(const ProSettingsSmsDisabled());
      await settle();
      expect(b.state.sms?.mode, 'none');
      expect(b.state.notice, 'sms.disabled');
    });

    test('mot de passe : un mauvais mot de passe actuel reste sur le champ', () async {
      when(() => changePassword(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation', fields: {'currentPassword': 'wrong_password'})));
      final b = bloc()..add(const ProSettingsPasswordChanged(currentPassword: 'x', newPassword: 'nouveau-mot-de-passe'));
      await settle();
      expect(b.state.actionState, ViewState.error);
      expect(b.state.fieldErrors, {'currentPassword': 'wrong_password'});
    });
  });
}

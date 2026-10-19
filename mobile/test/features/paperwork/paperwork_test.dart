import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/paperwork/data/datasources/paperwork_data_source.dart';
import 'package:parking_app/src/features/paperwork/data/models/paperwork_models.dart';
import 'package:parking_app/src/features/paperwork/domain/repositories/paperwork_repository.dart';
import 'package:parking_app/src/features/paperwork/domain/usecases/paperwork_use_cases.dart';
import 'package:parking_app/src/features/paperwork/presentation/bloc/paperwork_bloc.dart';
import 'package:parking_app/src/features/paperwork/presentation/pages/traveller_inspection_page.dart';
import 'package:parking_app/src/features/paperwork/presentation/widgets/paperwork_widgets.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

/// « Contrat signé et état des lieux » (19/10/2026).

final _png = Uint8List.fromList([
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01, //
  0x08,
  0x06,
  0x00,
  0x00,
  0x00,
  0x1F,
  0x15,
  0xC4,
  0x89,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x44,
  0x41,
  0x54,
  0x78,
  0x9C,
  0x63,
  0xF8,
  0xCF,
  0xC0,
  0xF0, //
  0x1F,
  0x00,
  0x05,
  0x00,
  0x01,
  0xFF,
  0x89,
  0x99,
  0x3D,
  0x1D,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
  0x42,
  0x60,
  0x82,
]);

PaperworkModel _paperwork({String decision = 'pending', bool canAnswer = true, bool signed = false}) => PaperworkModel(
  status: 'arrived',
  contract: ContractModel(
    status: signed ? 'signed' : 'unsigned',
    canSign: !signed,
    codeAvailable: true,
    phoneMasked: '06 •• •• •• 78',
    document: const ContractDocumentModel(title: 'Contrat de stationnement · Parking LYS', summary: ['Client : Camille Martin'], clauses: ['Objet.']),
    signed: signed
        ? SignedContractModel(
            version: '2026-10-19',
            signedAt: DateTime.utc(2026, 11, 12, 5, 41),
            signerName: 'Camille Martin',
            method: 'sms_code',
            device: 'traveller_app',
            phoneMasked: '06 •• •• •• 78',
            proofSha256: 'a' * 64,
          )
        : null,
  ),
  dropoff: InspectionModel(
    kind: 'dropoff',
    startedAt: DateTime.utc(2026, 11, 12, 5, 30),
    completedAt: DateTime.utc(2026, 11, 12, 5, 41),
    performedBy: 'Karim',
    damages: const [DamageModel(n: 1, x: 0.8, y: 0.2, label: 'Rayure, aile avant droite')],
    mileageKm: 48215,
    fuelQuarters: 3,
    photos: [for (final s in inspectionSlots) InspectionPhotoModel(id: 'ph_$s', slot: s, takenAt: DateTime.utc(2026, 11, 12, 5, 35))],
    decision: decision,
    canAnswer: canAnswer,
  ),
);

class FakePaperworkSource implements PaperworkDataSource {
  PaperworkModel data = _paperwork();
  final calls = <String>[];

  @override
  Future<PaperworkModel> load(PaperworkOwner owner) async => data;

  @override
  Future<CodeSentModel> sendCode(PaperworkOwner owner) async {
    calls.add('code');
    return CodeSentModel(sentTo: '06 •• •• •• 78', expiresAt: DateTime.now().add(const Duration(minutes: 10)));
  }

  @override
  Future<PaperworkModel> sign(PaperworkOwner owner, {String? code, List<List<List<double>>>? strokes}) async {
    calls.add('sign:${code ?? 'hand'}');
    if (code == '000000') throw const ApiError('wrong_code', fields: {'code': 'wrong_code'}, status: 400).toDio();
    return data = _paperwork(signed: true);
  }

  @override
  Future<PaperworkModel> answer(PaperworkOwner owner, String kind, {required String decision, String? reserveText, List<List<List<double>>>? strokes}) async {
    calls.add('answer:$kind:$decision:${reserveText ?? ''}');
    return data = _paperwork(decision: decision, canAnswer: false);
  }

  @override
  Future<Uint8List> photo(PaperworkOwner owner, String kind, String photoId) async => _png;

  @override
  Future<PaperworkModel> start(String reservationId, String kind) async {
    calls.add('start:$kind');
    return data;
  }

  @override
  Future<PaperworkModel> update(String reservationId, String kind, Map<String, dynamic> body) async => data;

  @override
  Future<AddedPhotoModel> addPhoto(String reservationId, String kind, String slot, Uint8List bytes) async =>
      AddedPhotoModel(photoId: 'ph_new', paperwork: data);

  @override
  Future<PaperworkModel> removePhoto(String reservationId, String kind, String photoId) async => data;

  @override
  Future<PaperworkModel> complete(String reservationId, String kind) async {
    calls.add('complete:$kind');
    return data;
  }
}

late FakePaperworkSource source;

void _register() {
  source = FakePaperworkSource();
  final repository = PaperworkRepositoryImpl(source);
  locator
    ..registerSingleton<PaperworkRepository>(repository)
    ..registerSingleton(LoadInspectionPhotoUseCase(repository))
    ..registerFactory(
      () => PaperworkBloc(
        LoadPaperworkUseCase(repository),
        SendSignatureCodeUseCase(repository),
        SignContractUseCase(repository),
        AnswerInspectionUseCase(repository),
        EditInspectionUseCase(repository),
      ),
    );
}

void main() {
  setUpAll(setUpLocalizedTests);
  setUp(_register);
  tearDown(locator.reset);

  group('signature à la main', () {
    test('les points sont ramenés entre 0 et 1, et il en faut 5', () {
      final c = SignatureController()
        ..start(const Offset(0.1, 0.2))
        ..extend(const Offset(0.2, 0.3))
        ..extend(const Offset(1.4, 0.4));
      expect(c.signed, isFalse);
      c
        ..extend(const Offset(0.5, 0.5))
        ..extend(const Offset(0.6, 0.6));
      expect(c.signed, isTrue);
      expect(c.toJson().first[2], [1.0, 0.4]);
      c.clear();
      expect(c.points, 0);
    });
  });

  group('PaperworkBloc', () {
    test('le voyageur demande un code puis signe ; un code faux garde le champ en erreur', () async {
      final bloc = locator<PaperworkBloc>()..add(const PaperworkStarted(TravellerOwner('PZ48K2')));
      await bloc.stream.firstWhere((s) => s.data != null);
      bloc.add(const PaperworkCodeRequested());
      await bloc.stream.firstWhere((s) => s.codeSent != null);
      bloc.add(const PaperworkSigned(code: '000000'));
      final failed = await bloc.stream.firstWhere((s) => s.errorFields != null);
      expect(failed.errorFields, {'code': 'wrong_code'});
      bloc
        ..add(const PaperworkErrorDismissed())
        ..add(const PaperworkSigned(code: '482916'));
      final signed = await bloc.stream.firstWhere((s) => s.notice == 'signed');
      expect(signed.data!.contract.isSigned, isTrue);
      expect(source.calls, ['code', 'sign:000000', 'sign:482916']);
      await bloc.close();
    });

    test('Plazo Pro ouvre un état des lieux : il est commencé sur le serveur', () async {
      final bloc = locator<PaperworkBloc>()..add(const PaperworkStarted(StaffOwner('res_1'), startKind: 'dropoff'));
      await bloc.stream.firstWhere((s) => s.data != null);
      bloc.add(const PaperworkEdited(CompleteInspection('res_1', 'dropoff')));
      await bloc.stream.firstWhere((s) => s.notice == 'completed');
      expect(source.calls, ['start:dropoff', 'complete:dropoff']);
      await bloc.close();
    });
  });

  group('état des lieux côté voyageur', () {
    testWidgets('photos, dégâts et kilométrage ; « C\'est conforme » répond au parking', (tester) async {
      await pumpLocalized(
        tester,
        Builder(
          builder: (context) => const TravellerInspectionPage(reference: 'PZ48K2', kind: 'dropoff').wrappedRoute(context),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text("L'état de votre voiture au dépôt"), findsOneWidget);
      expect(find.textContaining('Karim a pris 6 photos et noté 1 marque(s)'), findsOneWidget);
      expect(find.text('Rayure, aile avant droite'), findsOneWidget);
      expect(find.text('48215 km'), findsOneWidget);
      await tester.scrollUntilVisible(find.byKey(const Key('traveller-accept')), 300, scrollable: find.byType(Scrollable).first);
      await tester.tap(find.byKey(const Key('traveller-accept')));
      await tester.pumpAndSettle();
      expect(source.calls, ['answer:dropoff:accepted:']);
      expect(find.byKey(const Key('traveller-decision')), findsOneWidget);
    });

    testWidgets('« Je signale un oubli » envoie la réserve avec ses mots', (tester) async {
      await pumpLocalized(
        tester,
        Builder(
          builder: (context) => const TravellerInspectionPage(reference: 'PZ48K2', kind: 'dropoff').wrappedRoute(context),
        ),
      );
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(find.byKey(const Key('traveller-reserve')), 300, scrollable: find.byType(Scrollable).first);
      await tester.tap(find.byKey(const Key('traveller-reserve')));
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('traveller-reserve-text')), 'La rayure arrière gauche manque.');
      await tester.pump();
      await tester.tap(find.byKey(const Key('traveller-reserve-send')));
      await tester.pumpAndSettle();
      expect(source.calls, ['answer:dropoff:reserved:La rayure arrière gauche manque.']);
    });
  });
}

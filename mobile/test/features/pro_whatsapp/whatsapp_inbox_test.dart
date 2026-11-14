import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_whatsapp/data/whatsapp_inbox_data_source.dart';
import 'package:parking_app/src/features/pro_whatsapp/presentation/pro_whatsapp_conversation_page.dart';
import 'package:parking_app/src/features/pro_whatsapp/presentation/pro_whatsapp_inbox_page.dart';
import 'package:parking_app/src/features/pro_whatsapp/presentation/write_to_traveller_sheet.dart';
import 'package:parking_app/src/services/link_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

// « Messages WhatsApp » in Plazo Pro (12/11/2026, direction A of the web on a phone).

final _now = DateTime.now();

WaConversation _conv({DateTime? replyUntil, int unread = 2}) => WaConversation(
  id: 'c1',
  phone: '06 12 34 56 78',
  name: 'Sébastien Morel',
  reservation: WaReservation(id: 'r1', reference: 'R7KQ2M', externalReference: null, arrivalAt: _now, returnAt: _now.add(const Duration(days: 4))),
  lastMessageAt: _now.subtract(const Duration(minutes: 1)),
  unread: unread,
  handledAt: null,
  previewText: 'On arrive plutôt vers 8h, c’est possible ?',
  previewOut: false,
  replyUntil: replyUntil,
  unknown: false,
  replyBy: replyUntil == null ? null : 'whatsapp',
);

class FakeInbox implements WhatsappInboxDataSource {
  FakeInbox({this.open = true, this.app = false});
  final bool open;
  final bool app;
  final views = <String>[];
  final replies = <String>[];
  final handled = <bool>[];

  @override
  Future<WaInbox> list(String view) async {
    views.add(view);
    return WaInbox(items: [_conv()], counts: const {'unread': 1, 'all': 3, 'handled': 2, 'sent': 2});
  }

  @override
  Future<List<WaSentMessage>> sent() async => [
    WaSentMessage(
      sent: WaSent(id: 'w1', kind: 'booking_reminder', status: 'read', at: _now, text: 'Bonjour Sébastien, rendez-vous demain à 8h.'),
      phone: '06 12 34 56 78',
      smsFallback: false,
      customerName: 'Sébastien Morel',
      reference: 'R7KQ2M',
      reservationId: 'r1',
      conversationId: 'c1',
    ),
    WaSentMessage(
      sent: WaSent(id: 'w2', kind: 'booking_confirmed', status: 'sent', at: _now),
      phone: '06 99 88 77 66',
      smsFallback: false,
      customerName: null,
      reference: null,
      reservationId: null,
      conversationId: null,
    ),
  ];

  @override
  Future<WaThread> get(String id) async => WaThread(
    conversation: app
        ? WaConversation(
            id: 'c1',
            phone: '06 12 34 56 78',
            name: 'Sébastien Morel',
            reservation: null,
            lastMessageAt: _now,
            unread: 0,
            handledAt: null,
            previewText: '',
            previewOut: false,
            replyUntil: null,
            unknown: false,
            replyBy: 'app',
          )
        : _conv(replyUntil: open ? _now.add(const Duration(hours: 23)) : null, unread: 0),
    messages: [
      WaMessage(
        id: 'm1',
        out: false,
        type: 'text',
        text: 'On arrive plutôt vers 8h, c’est possible ?',
        hasMedia: false,
        status: null,
        at: _now.subtract(const Duration(minutes: 2)),
        by: null,
        app: app,
      ),
      WaMessage(id: 'm2', out: false, type: 'image', text: null, hasMedia: true, status: null, at: _now.subtract(const Duration(minutes: 1)), by: null),
      for (final (i, r) in replies.indexed) WaMessage(id: 'r$i', out: true, type: 'text', text: r, hasMedia: false, status: 'sent', at: _now, by: 'Joanny'),
    ],
    sent: [WaSent(id: 's1', kind: 'booking_reminder', status: 'read', at: _now.subtract(const Duration(hours: 1)), text: 'Rendez-vous demain à 8h.')],
  );

  @override
  Future<WaMessage> reply(String id, String text) async {
    replies.add(text);
    return WaMessage(id: 'x', out: true, type: 'text', text: text, hasMedia: false, status: 'sent', at: _now, by: 'Joanny');
  }

  @override
  Future<WaConversation> setHandled(String id, bool value) async {
    handled.add(value);
    return _conv();
  }

  @override
  Future<Uint8List> media(String messageId) async => Uint8List(0);

  @override
  Future<int> unreadCount() async => 1;

  final written = <String>[];
  bool freeWindow = false;

  @override
  Future<WriteStatus> writeStatus(String reservationId) async => WriteStatus(
    whatsapp: true,
    sms: true,
    freeUntil: freeWindow ? _now.add(const Duration(hours: 5)) : null,
    frameBefore: 'Message de APL Parking pour votre réservation R7KQ2M :',
    frameAfter: "Merci d'avoir choisi votre parking avec Plazo.",
    canWrite: true,
    refusal: null,
    maxLength: 900,
  );

  @override
  Future<WriteResult> write(String reservationId, String text, String channel) async {
    written.add('$channel:$text');
    return WriteResult(channel: channel, fallback: false, conversationId: 'c1');
  }
}

void main() {
  setUpAll(setUpLocalizedTests);

  testWidgets('la liste : pilules avec leurs comptes, la conversation, son aperçu et ses non lus', (tester) async {
    final inbox = FakeInbox();
    ProWhatsappInboxPage.debugSource = inbox;
    addTearDown(() => ProWhatsappInboxPage.debugSource = null);
    await pumpLocalized(tester, const ProWhatsappInboxPage());
    await tester.pumpAndSettle();
    expect(inbox.views, ['all']);
    expect(find.text('À traiter · 3'), findsOneWidget);
    expect(find.text('Non lus · 1'), findsOneWidget);
    expect(find.text('Sébastien Morel'), findsOneWidget);
    expect(find.text('R7KQ2M · 06 12 34 56 78'), findsOneWidget);
    expect(find.byKey(const Key('wa-unread-c1')), findsOneWidget);
    await tester.tap(find.text('Non lus · 1'));
    await tester.pumpAndSettle();
    expect(inbox.views.last, 'unread');

    // « Envoyés » (12/11/2026): what Plazo sent, with its text.
    await tester.tap(find.text('Envoyés · 2'));
    await tester.pumpAndSettle();
    expect(find.text('Bonjour Sébastien, rendez-vous demain à 8h.'), findsOneWidget);
    expect(find.text('Veille du dépôt'), findsOneWidget);
    expect(find.text('Texte non gardé (envoyé avant le 12/11/2026).'), findsOneWidget);
    expect(find.text('Voir la conversation ›'), findsOneWidget);
  });

  testWidgets('la conversation : messages du client, message de Plazo, réponse dans les 24 h', (tester) async {
    final inbox = FakeInbox();
    ProWhatsappConversationPage.debugSource = inbox;
    addTearDown(() => ProWhatsappConversationPage.debugSource = null);
    await pumpLocalized(tester, const ProWhatsappConversationPage(id: 'c1'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('wa-in')), findsNWidgets(2));
    expect(find.textContaining('Veille du dépôt envoyé par Plazo'), findsOneWidget);
    expect(find.text('Rendez-vous demain à 8h.'), findsOneWidget);
    expect(find.text('Voir la photo'), findsOneWidget);
    expect(find.byKey(const Key('wa-window')), findsOneWidget);
    await tester.enterText(find.byKey(const Key('wa-reply')), 'Oui, à demain 8h.');
    await tester.tap(find.byKey(const Key('wa-send')));
    await tester.pumpAndSettle();
    expect(inbox.replies, ['Oui, à demain 8h.']);
    expect(find.byKey(const Key('wa-out')), findsOneWidget);
    expect(find.textContaining('Joanny ·'), findsOneWidget);
  });

  testWidgets('SMS et appel avec son propre téléphone, depuis l’en-tête (choix A du 13/11/2026)', (tester) async {
    final links = FakeLinks();
    locator.registerSingleton<LinkService>(links);
    addTearDown(() => locator.unregister<LinkService>());
    ProWhatsappConversationPage.debugSource = FakeInbox(open: true);
    addTearDown(() => ProWhatsappConversationPage.debugSource = null);
    await pumpLocalized(tester, const ProWhatsappConversationPage(id: 'c1'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('wa-sms')));
    await tester.tap(find.byKey(const Key('wa-call')));
    await tester.pump();
    expect(links.opened, [Uri.parse('sms:0612345678'), Uri.parse('tel:0612345678')]);
  });

  testWidgets('après 24 h : plus de champ, « Appeler le … »', (tester) async {
    ProWhatsappConversationPage.debugSource = FakeInbox(open: false);
    addTearDown(() => ProWhatsappConversationPage.debugSource = null);
    await pumpLocalized(tester, const ProWhatsappConversationPage(id: 'c1'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('wa-window-closed')), findsOneWidget);
    expect(find.byKey(const Key('wa-reply')), findsNothing);
    expect(find.text('Appeler le 06 12 34 56 78'), findsOneWidget);
  });

  testWidgets('écrit depuis l’app Plazo : pastille, et la réponse part dans l’app après 24 h', (tester) async {
    final inbox = FakeInbox(open: false, app: true);
    ProWhatsappConversationPage.debugSource = inbox;
    addTearDown(() => ProWhatsappConversationPage.debugSource = null);
    await pumpLocalized(tester, const ProWhatsappConversationPage(id: 'c1'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('wa-app')), findsOneWidget);
    expect(find.byKey(const Key('wa-window-app')), findsOneWidget);
    expect(find.byKey(const Key('wa-window-closed')), findsNothing);
    await tester.enterText(find.byKey(const Key('wa-reply')), 'Oui.');
    await tester.tap(find.byKey(const Key('wa-send')));
    await tester.pumpAndSettle();
    expect(inbox.replies, ['Oui.']);
  });

  testWidgets('« Écrire au client » : hors des 24 h dans le modèle validé, WhatsApp ou SMS du parking', (tester) async {
    final inbox = FakeInbox();
    WriteToTravellerSheet.debugSource = inbox;
    addTearDown(() => WriteToTravellerSheet.debugSource = null);
    await pumpLocalized(tester, const Scaffold(body: WriteToTravellerSheet(reservationId: 'r1')));
    await tester.pumpAndSettle();
    expect(find.text('Message de APL Parking pour votre réservation R7KQ2M :'), findsOneWidget);
    expect(find.byKey(const Key('write-channel-sms')), findsOneWidget);
    expect(tester.widget<FilledButton>(find.byKey(const Key('write-send'))).onPressed, isNull);
    await tester.enterText(find.byKey(const Key('write-text')), 'La navette part à 8h.');
    await tester.pump();
    await tester.tap(find.byKey(const Key('write-send')));
    await tester.pumpAndSettle();
    expect(inbox.written, ['whatsapp:La navette part à 8h.']);
  });

  testWidgets('« Écrire au client » : dans les 24 h, texte libre ; par SMS si choisi', (tester) async {
    final inbox = FakeInbox()..freeWindow = true;
    WriteToTravellerSheet.debugSource = inbox;
    addTearDown(() => WriteToTravellerSheet.debugSource = null);
    await pumpLocalized(tester, const Scaffold(body: WriteToTravellerSheet(reservationId: 'r1')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('write-frame-before')), findsNothing);
    expect(find.textContaining('texte libre jusqu'), findsOneWidget);
    await tester.tap(find.byKey(const Key('write-channel-sms')));
    await tester.enterText(find.byKey(const Key('write-text')), 'Bonjour');
    await tester.pump();
    await tester.tap(find.byKey(const Key('write-send')));
    await tester.pumpAndSettle();
    expect(inbox.written, ['sms:Bonjour']);
  });
}

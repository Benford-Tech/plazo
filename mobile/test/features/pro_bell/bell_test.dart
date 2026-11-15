import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_bell/data/bell_data_source.dart';
import 'package:parking_app/src/features/pro_bell/presentation/channels_section.dart';
import 'package:parking_app/src/features/pro_bell/presentation/pro_bell_page.dart';

import '../../helpers/pump_app.dart';

class FakeBell implements BellDataSource {
  final read = <List<String>?>[];
  final set = <String>[];
  String? lastFilter;
  final now = DateTime.now();

  @override
  Future<BellPage> list({String filter = 'all', DateTime? before}) async {
    lastFilter = filter;
    return BellPage(
      unread: 1,
      hasMore: false,
      items: [
        BellNotification(id: 'n1', event: 'return', title: 'Client atterri · TO 3627', body: 'Marie Leroy · Terminal 1', target: null, createdAt: now, readAt: null),
        BellNotification(id: 'n2', event: 'shuttle', title: 'Navette de retour', body: 'Karim', target: null, createdAt: now, readAt: now),
      ],
    );
  }

  @override
  Future<int> count() async => 1;

  @override
  Future<int> markRead([List<String>? ids]) async {
    read.add(ids);
    return 0;
  }

  final cleared = <String>[];

  @override
  Future<(int, int)> clear({List<String>? ids, bool read = false, bool all = false}) async {
    cleared.add(ids != null ? ids.join(',') : (all ? 'all' : 'read'));
    return (ids?.length ?? 1, 0);
  }

  @override
  Future<NotificationChannels> channels() async => const NotificationChannels(
    role: 'manager',
    channels: {
      'arrival': ChannelSet(phone: true, browser: false, bell: true),
      'inbox': ChannelSet(phone: false, browser: true, bell: true),
    },
  );

  @override
  Future<NotificationChannels> setChannel(String event, String channel, bool value) async {
    set.add('$event.$channel=$value');
    return NotificationChannels(
      role: 'manager',
      channels: {
        'arrival': const ChannelSet(phone: true, browser: false, bell: true),
        'inbox': ChannelSet(phone: value, browser: true, bell: true),
      },
    );
  }

  @override
  Future<NotificationTest> test() async => const NotificationTest(phones: 2, phonesConfigured: true);

  @override
  Stream<int> get unreadChanges => const Stream.empty();
}

void main() {
  setUpAll(setUpLocalizedTests);

  // 15/11/2026 (« pouvoir nettoyer les notifications », choix C).
  testWidgets('glisser efface une notification, le menu efface les lues ou tout après confirmation', (tester) async {
    final bell = FakeBell();
    ProBellPage.debugSource = bell;
    addTearDown(() => ProBellPage.debugSource = null);
    await pumpLocalized(tester, const ProBellPage());
    await tester.pumpAndSettle();
    await tester.drag(find.byKey(const Key('bell-item-n2')), const Offset(-600, 0));
    await tester.pumpAndSettle();
    expect(bell.cleared, ['n2']);
    expect(find.text('Navette de retour'), findsNothing);

    await tester.tap(find.byKey(const Key('bell-menu')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('bell-clear-read')));
    await tester.pumpAndSettle();
    expect(bell.cleared.last, 'read');

    await tester.tap(find.byKey(const Key('bell-menu')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('bell-clear-all')));
    await tester.pumpAndSettle();
    expect(find.text('Effacer toutes vos notifications ?'), findsOneWidget);
    await tester.tap(find.byKey(const Key('bell-clear-all-confirm')));
    await tester.pumpAndSettle();
    expect(bell.cleared.last, 'all');
    expect(find.text('Client atterri · TO 3627'), findsNothing);
  });

  testWidgets('la cloche (02/11/2026) : non lues marquées, un toucher la lit, filtres et « Tout lu »', (tester) async {
    final bell = FakeBell();
    ProBellPage.debugSource = bell;
    addTearDown(() => ProBellPage.debugSource = null);
    await pumpLocalized(tester, const ProBellPage());
    await tester.pumpAndSettle();
    expect(find.text('Client atterri · TO 3627'), findsOneWidget);
    expect(find.text('AUJOURD\'HUI'), findsOneWidget);
    expect(find.byKey(const Key('bell-unread-n1')), findsOneWidget);
    expect(find.byKey(const Key('bell-unread-n2')), findsNothing);
    await tester.tap(find.byKey(const Key('bell-item-n1')));
    await tester.pump();
    expect(bell.read.single, ['n1']);
    expect(find.byKey(const Key('bell-unread-n1')), findsNothing);

    await tester.tap(find.byKey(const Key('bell-filter-shuttle')));
    await tester.pumpAndSettle();
    expect(bell.lastFilter, 'shuttle');
    await tester.tap(find.byKey(const Key('bell-mark-all')));
    await tester.pump();
    expect(bell.read.last, isNull);
  });

  testWidgets('où arrive chaque notification : la cloche et le téléphone, puis un test', (tester) async {
    final bell = FakeBell();
    await pumpLocalized(tester, Scaffold(body: SingleChildScrollView(child: ChannelsSection(source: bell))));
    await tester.pumpAndSettle();
    expect(find.text('Mail à vérifier'), findsOneWidget);
    // The arrivals' phone switch is the older one, above.
    expect(find.byKey(const Key('channel-arrival-phone')), findsNothing);
    expect(find.text('réglé plus haut'), findsOneWidget);
    await tester.tap(find.byKey(const Key('channel-inbox-phone')));
    await tester.pumpAndSettle();
    expect(bell.set, ['inbox.phone=true']);
    expect(tester.widget<Checkbox>(find.byKey(const Key('channel-inbox-phone'))).value, isTrue);

    await tester.tap(find.byKey(const Key('notif-test')));
    await tester.pumpAndSettle();
    expect(find.text('Envoyée dans la cloche et sur 2 téléphone(s).'), findsOneWidget);
  });
}

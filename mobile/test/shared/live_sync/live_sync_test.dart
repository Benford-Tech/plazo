import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/shared/live_sync/live_sync.dart';

/// 02/11/2026, « les actions doivent être synchronisées entre l'espace admin et l'application ».
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('fires when the version moves, never on the first read nor when it stays', () async {
    final versions = ['a', 'a', 'b', 'b', 'c'];
    var reads = 0;
    final sync = LiveSync(() async => versions[reads++], interval: const Duration(hours: 1));
    var changes = 0;
    final sub = sync.changes.listen((_) => changes++);
    await Future<void>.delayed(Duration.zero); // the first read, on listen
    expect(changes, 0);
    for (var i = 0; i < 4; i++) {
      await sync.check();
    }
    await Future<void>.delayed(Duration.zero);
    expect(reads, 5);
    expect(changes, 2);
    await sub.cancel();
  });

  test('reads nothing while nobody listens, and survives a failed read', () async {
    var reads = 0;
    final sync = LiveSync(() async {
      reads++;
      if (reads == 2) throw Exception('offline');
      return 'v$reads';
    }, interval: const Duration(hours: 1));
    await sync.check();
    expect(reads, 0);
    var changes = 0;
    final sub = sync.changes.listen((_) => changes++);
    await Future<void>.delayed(Duration.zero);
    await sync.check(); // fails
    await sync.check(); // v3, after v1
    await Future<void>.delayed(Duration.zero);
    expect(changes, 1);
    await sub.cancel();
  });
}

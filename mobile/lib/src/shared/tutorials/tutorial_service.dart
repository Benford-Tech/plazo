import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';

/// Which tutorials were seen (on this phone only, nothing goes to the server), and the replays asked from
/// Plus › Tutoriels. One instance for the app: the shells, the pages and the list read it.
class TutorialService extends ChangeNotifier {
  TutorialService._();

  static final instance = TutorialService._();

  /// Off in the widget tests and with --dart-define=TUTORIALS=false (store screenshots, emulator runs).
  static bool enabled = AppConstants.tutorials;

  static const _key = 'tutorials.seen';

  Set<String> _seen = {};
  bool _ready = false;
  Future<void>? _loading;

  /// A carousel or bubbles on screen: nothing else starts meanwhile.
  bool busy = false;

  /// The welcome carousel of what is on screen (Plazo's, or the post's in Plazo Pro): the bubbles wait for it.
  String? welcomeId;

  /// Asked from Plus › Tutoriels: shown again even if seen.
  String? replay;

  /// Set by the shell: shows one of its tabs (`tab-search`, `ptab-shuttle`…), false when it has no such tab.
  bool Function(String tab)? openTab;

  bool get ready => _ready;

  Future<void> load() => _loading ??= () async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _seen = (prefs.getStringList(_key) ?? const []).toSet();
    } catch (_) {
      // No storage: everything shows once per launch.
    }
    _ready = true;
    notifyListeners();
  }();

  bool isSeen(String id) => _seen.contains(id);

  /// Due now: never seen, or asked again.
  bool isDue(String id) => replay == id || !isSeen(id);

  /// Bubbles wait for the welcome carousel of the screen.
  bool get welcomeDone => welcomeId == null || isSeen(welcomeId!);

  Future<void> markSeen(String id) async {
    if (replay == id) replay = null;
    if (_seen.add(id)) await _save();
    notifyListeners();
  }

  /// « Revoir » / « Tout revoir »: shown again the next time their screen opens.
  Future<void> reset(Iterable<String> ids) async {
    final before = _seen.length;
    _seen.removeAll(ids);
    if (_seen.length != before) await _save();
    notifyListeners();
  }

  void requestReplay(String id) {
    replay = id;
    notifyListeners();
  }

  Future<void> _save() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_key, _seen.toList()..sort());
    } catch (_) {}
  }

  @visibleForTesting
  void resetForTest() {
    _seen = {};
    _ready = false;
    _loading = null;
    busy = false;
    welcomeId = null;
    replay = null;
    openTab = null;
  }
}

import 'package:flutter_test/flutter_test.dart';

/// A phone drawn edge-to-edge (Android 15+, 15/10/2026): the app runs under a 24 dp status bar and, by default, a
/// 48 dp 3-button navigation bar, the tallest one. Sets the test view's insets (logical pixels) until the test ends.
void setSystemBars(WidgetTester tester, {double top = 24, double bottom = 48, double left = 0, double right = 0}) {
  final ratio = tester.view.devicePixelRatio;
  final padding = FakeViewPadding(left: left * ratio, top: top * ratio, right: right * ratio, bottom: bottom * ratio);
  tester.view.padding = padding;
  tester.view.viewPadding = padding;
  addTearDown(tester.view.resetPadding);
  addTearDown(tester.view.resetViewPadding);
}

/// Expects the widget [finder] finds to lie fully outside the system bars set by [setSystemBars].
void expectClearOfSystemBars(WidgetTester tester, Finder finder) {
  final rect = tester.getRect(finder);
  final ratio = tester.view.devicePixelRatio;
  final screen = tester.view.physicalSize / ratio;
  final insets = tester.view.viewPadding;
  expect(rect.top, greaterThanOrEqualTo(insets.top / ratio), reason: 'under the status bar: $rect');
  expect(
    rect.bottom,
    lessThanOrEqualTo(screen.height - insets.bottom / ratio),
    reason: 'under the navigation bar: $rect',
  );
  expect(rect.left, greaterThanOrEqualTo(insets.left / ratio), reason: 'under a side bar or cutout: $rect');
  expect(
    rect.right,
    lessThanOrEqualTo(screen.width - insets.right / ratio),
    reason: 'under a side bar or cutout: $rect',
  );
}

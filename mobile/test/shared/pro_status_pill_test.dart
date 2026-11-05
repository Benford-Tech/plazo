import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/shared/widgets/pro_status_pill.dart';

void main() {
  test('one solid colour per status: amber waiting, green on site', () {
    expect(ProStatusPill.colorOf('upcoming'), const Color(0xFFB45309));
    expect(ProStatusPill.colorOf('arrived'), const Color(0xFF15803D));
    expect(ProStatusPill.colorOf('return_requested'), ProStatusPill.colorOf('upcoming'));
    expect(ProStatusPill.colorOf('back_at_parking'), ProStatusPill.colorOf('arrived'));
    expect(ProStatusPill.colorOf('cancelled'), isNot(ProStatusPill.colorOf('returned')));
  });
}

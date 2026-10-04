import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/posts.dart';
import 'package:parking_app/src/core/router/app_router.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';

void main() {
  test('R-C · les onglets suivent le poste du jour', () {
    expect(tabsFor('driver').map((t) => t.route.routeName), [ProShuttleRoute.name, ProArrivalsRoute.name, ProReturnsRoute.name, ProMoreTabRoute.name]);
    expect(tabsFor('valet').map((t) => t.route.routeName), [ProOccupationRoute.name, ProTodayRoute.name, ProSpotPlanningRoute.name, ProMoreTabRoute.name]);
    for (final post in ['agent', 'manager']) {
      expect(tabsFor(post).map((t) => t.route.routeName), [ProTodayRoute.name, ProReservationsRoute.name, ProOccupationRoute.name, ProMoreTabRoute.name]);
    }
    expect(tabsFor('driver').map((t) => t.label), ['shuttle', 'arrivals', 'returns', 'more']);
  });

  test('le poste actif est celui choisi, sinon le rôle', () {
    const base = StaffModel(id: 's1', name: 'Karim', email: 'k@example.com', role: 'manager');
    expect(base.activePost, 'manager');
    expect(base.copyWith(post: 'driver', effectivePost: 'driver').activePost, 'driver');
  });
}

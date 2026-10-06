import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

import '../router/app_router.dart';

/// One tab of Plazo Pro: its route under /pro, its icon and its label key (`pro_tabs.<label>`).
class ProTab {
  const ProTab({required this.route, required this.icon, required this.label, required this.key});
  final PageRouteInfo route;
  final IconData icon;
  final String label;
  final String key;
}

/// The four posts a staff member can hold for the day (R-C, 04/10/2026), in the order of the sheet.
const posts = ['manager', 'agent', 'driver', 'valet'];

/// The four tabs of each post: the pages of the day's work first, "Plus" keeps the rest.
///
/// - driver: the shuttle, then the arrivals and returns of the day;
/// - valet: the parking (arrivals to place, keys), the day, the spot planning;
/// - agent and manager: the day, the bookings, the parking.
List<ProTab> tabsFor(String post) {
  const more = ProTab(route: ProMoreTabRoute(), icon: Icons.more_horiz_rounded, label: 'more', key: 'ptab-more');
  const today = ProTab(route: ProTodayRoute(), icon: Icons.today_rounded, label: 'today', key: 'ptab-today');
  final parking = ProTab(route: ProOccupationRoute(), icon: Icons.local_parking_rounded, label: 'parking', key: 'ptab-parking');
  switch (post) {
    case 'driver':
      return [
        ProTab(route: ProShuttleRoute(), icon: Icons.directions_bus_rounded, label: 'shuttle', key: 'ptab-shuttle'),
        const ProTab(route: ProArrivalsRoute(), icon: Icons.flight_takeoff_rounded, label: 'arrivals', key: 'ptab-arrivals'),
        const ProTab(route: ProReturnsRoute(), icon: Icons.flight_land_rounded, label: 'returns', key: 'ptab-returns'),
        more,
      ];
    case 'valet':
      return [
        parking,
        today,
        const ProTab(route: ProSpotPlanningRoute(), icon: Icons.view_timeline_outlined, label: 'places', key: 'ptab-places'),
        more,
      ];
    default:
      return [
        today,
        const ProTab(route: ProReservationsRoute(), icon: Icons.list_alt_rounded, label: 'reservations', key: 'ptab-reservations'),
        parking,
        more,
      ];
  }
}

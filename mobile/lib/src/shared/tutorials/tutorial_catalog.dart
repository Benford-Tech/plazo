import 'package:flutter/material.dart';

/// Tutorials (A + B, 21/10/2026): a welcome carousel at the first launch (one per post of the day in Plazo Pro), then
/// guided bubbles the first time a main screen opens; Plus › Tutoriels replays them.
enum TutorialKind { carousel, bubbles }

/// One page of a carousel or one bubble. Its texts are `tutorials.<slug>.s<n>_title` / `_body` (n from 1).
class TutorialStep {
  const TutorialStep({this.icon = Icons.lightbulb_outline_rounded, this.targets = const []});

  final IconData icon;

  /// Bubbles: the keys of the widgets the bubble points at, the first one on screen wins. A step none of whose
  /// targets is on screen is left out (the return block before the return day, the services of a closed booking).
  final List<String> targets;
}

class Tutorial {
  const Tutorial({required this.id, required this.kind, required this.steps, this.tab, this.post});

  /// Stored once seen (on the phone only).
  final String id;
  final TutorialKind kind;
  final List<TutorialStep> steps;

  /// Bubbles: the shell tab whose page shows them (`tab-search`, `ptab-shuttle`…), null for a pushed page.
  final String? tab;

  /// Plazo Pro carousels: the post of the day they present.
  final String? post;

  /// The texts' prefix: `tutorials.<slug>`.
  String get slug => id.replaceAll('.', '_');
  String titleKey(int step) => 'tutorials.$slug.s${step + 1}_title';
  String bodyKey(int step) => 'tutorials.$slug.s${step + 1}_body';
}

abstract final class Tutorials {
  // Plazo.
  static const welcome = Tutorial(
    id: 'welcome',
    kind: TutorialKind.carousel,
    steps: [
      TutorialStep(icon: Icons.local_parking_rounded),
      TutorialStep(icon: Icons.credit_card_rounded),
      TutorialStep(icon: Icons.directions_car_rounded),
      TutorialStep(icon: Icons.flight_land_rounded),
    ],
  );
  static const search = Tutorial(
    id: 'search',
    kind: TutorialKind.bubbles,
    tab: 'tab-search',
    steps: [
      TutorialStep(targets: ['search-dates']),
      TutorialStep(targets: ['search-submit']),
      TutorialStep(targets: ['search-map']),
      TutorialStep(targets: ['tab-trips']),
    ],
  );
  static const booking = Tutorial(
    id: 'booking',
    kind: TutorialKind.bubbles,
    steps: [
      TutorialStep(targets: ['booking-card']),
      TutorialStep(targets: ['booking-arrival']),
      TutorialStep(targets: ['booking-return']),
      TutorialStep(targets: ['booking-extras']),
    ],
  );

  // Plazo Pro: one carousel per post…
  static const proDriver = Tutorial(
    id: 'pro.welcome.driver',
    kind: TutorialKind.carousel,
    post: 'driver',
    steps: [
      TutorialStep(icon: Icons.directions_bus_rounded),
      TutorialStep(icon: Icons.check_box_rounded),
      TutorialStep(icon: Icons.flight_land_rounded),
      TutorialStep(icon: Icons.airport_shuttle_rounded),
    ],
  );
  static const proValet = Tutorial(
    id: 'pro.welcome.valet',
    kind: TutorialKind.carousel,
    post: 'valet',
    steps: [
      TutorialStep(icon: Icons.local_parking_rounded),
      TutorialStep(icon: Icons.view_column_rounded),
      TutorialStep(icon: Icons.swap_vert_rounded),
      TutorialStep(icon: Icons.search_rounded),
    ],
  );
  static const proAgent = Tutorial(
    id: 'pro.welcome.agent',
    kind: TutorialKind.carousel,
    post: 'agent',
    steps: [
      TutorialStep(icon: Icons.today_rounded),
      TutorialStep(icon: Icons.space_dashboard_rounded),
      TutorialStep(icon: Icons.list_alt_rounded),
      TutorialStep(icon: Icons.task_alt_rounded),
    ],
  );
  static const proManager = Tutorial(
    id: 'pro.welcome.manager',
    kind: TutorialKind.carousel,
    post: 'manager',
    steps: [
      TutorialStep(icon: Icons.badge_rounded),
      TutorialStep(icon: Icons.space_dashboard_rounded),
      TutorialStep(icon: Icons.group_rounded),
      TutorialStep(icon: Icons.tune_rounded),
    ],
  );

  /// T-B (26/10/2026, « un tutoriel pour bien démarrer avec Plazo Pro »): the guided tour of a parking's setup, six
  /// screens for every post, replayed from « Bien démarrer » and Plus › Tutoriels.
  static const proStart = Tutorial(
    id: 'pro.start',
    kind: TutorialKind.carousel,
    steps: [
      TutorialStep(icon: Icons.local_parking_rounded),
      TutorialStep(icon: Icons.mark_email_read_rounded),
      TutorialStep(icon: Icons.group_rounded),
      TutorialStep(icon: Icons.directions_bus_rounded),
      TutorialStep(icon: Icons.sell_rounded),
      TutorialStep(icon: Icons.sms_rounded),
    ],
  );

  // … and the bubbles of the main screens.
  static const proToday = Tutorial(
    id: 'pro.today',
    kind: TutorialKind.bubbles,
    tab: 'ptab-today',
    steps: [
      TutorialStep(targets: ['today-modes']),
      TutorialStep(targets: ['kpi-to-treat']),
      TutorialStep(targets: ['dashboard-services']),
    ],
  );
  static const proReservations = Tutorial(
    id: 'pro.reservations',
    kind: TutorialKind.bubbles,
    tab: 'ptab-reservations',
    steps: [
      TutorialStep(targets: ['res-search']),
      TutorialStep(targets: ['res-order']),
      TutorialStep(targets: ['res-new']),
    ],
  );
  static const proShuttle = Tutorial(
    id: 'pro.shuttle',
    kind: TutorialKind.bubbles,
    tab: 'ptab-shuttle',
    steps: [
      TutorialStep(targets: ['shuttle-bands']),
      TutorialStep(targets: ['slot-0']),
      TutorialStep(targets: ['start-trip']),
    ],
  );
  static const proOccupation = Tutorial(
    id: 'pro.occupation',
    kind: TutorialKind.bubbles,
    tab: 'ptab-parking',
    steps: [
      TutorialStep(targets: ['occupation-search']),
      TutorialStep(targets: ['files-summary', 'occupation-stats']),
      TutorialStep(targets: ['occupation-arrivals']),
      TutorialStep(targets: ['occ-planning']),
    ],
  );

  /// The carousel of a post (the agent's for an unknown one).
  static Tutorial welcomeFor(String post) => switch (post) {
    'driver' => proDriver,
    'valet' => proValet,
    'manager' => proManager,
    _ => proAgent,
  };

  /// What Plus › Tutoriels lists: Plazo's three, or the post's carousel and the bubbles of its tabs.
  static List<Tutorial> listFor({required bool pro, String post = 'agent'}) {
    if (!pro) return const [welcome, search, booking];
    return [
      welcomeFor(post),
      proStart,
      ...switch (post) {
        'driver' => const [proShuttle],
        'valet' => const [proOccupation, proToday],
        _ => const [proToday, proReservations, proOccupation],
      },
    ];
  }
}

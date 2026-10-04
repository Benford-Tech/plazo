// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'app_router.dart';

/// generated route for
/// [AppShellPage]
class AppShellRoute extends PageRouteInfo<void> {
  const AppShellRoute({List<PageRouteInfo>? children})
    : super(AppShellRoute.name, initialChildren: children);

  static const String name = 'AppShellRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const AppShellPage();
    },
  );
}

/// generated route for
/// [BookingFormPage]
class BookingFormRoute extends PageRouteInfo<BookingFormRouteArgs> {
  BookingFormRoute({
    Key? key,
    required String airport,
    required String parking,
    String? arrivee,
    String? retour,
    List<PageRouteInfo>? children,
  }) : super(
         BookingFormRoute.name,
         args: BookingFormRouteArgs(
           key: key,
           airport: airport,
           parking: parking,
           arrivee: arrivee,
           retour: retour,
         ),
         rawPathParams: {'airport': airport, 'parking': parking},
         rawQueryParams: {'arrivee': arrivee, 'retour': retour},
         initialChildren: children,
       );

  static const String name = 'BookingFormRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final pathParams = data.inheritedPathParams;
      final queryParams = data.queryParams;
      final args = data.argsAs<BookingFormRouteArgs>(
        orElse: () => BookingFormRouteArgs(
          airport: pathParams.getString('airport'),
          parking: pathParams.getString('parking'),
          arrivee: queryParams.optString('arrivee'),
          retour: queryParams.optString('retour'),
        ),
      );
      return WrappedRoute(
        child: BookingFormPage(
          key: args.key,
          airport: args.airport,
          parking: args.parking,
          arrivee: args.arrivee,
          retour: args.retour,
        ),
      );
    },
  );
}

class BookingFormRouteArgs {
  const BookingFormRouteArgs({
    this.key,
    required this.airport,
    required this.parking,
    this.arrivee,
    this.retour,
  });

  final Key? key;

  final String airport;

  final String parking;

  final String? arrivee;

  final String? retour;

  @override
  String toString() {
    return 'BookingFormRouteArgs{key: $key, airport: $airport, parking: $parking, arrivee: $arrivee, retour: $retour}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! BookingFormRouteArgs) return false;
    return key == other.key &&
        airport == other.airport &&
        parking == other.parking &&
        arrivee == other.arrivee &&
        retour == other.retour;
  }

  @override
  int get hashCode =>
      key.hashCode ^
      airport.hashCode ^
      parking.hashCode ^
      arrivee.hashCode ^
      retour.hashCode;
}

/// generated route for
/// [MeetingPointRoutePage]
class MeetingPointRouteRoute extends PageRouteInfo<MeetingPointRouteRouteArgs> {
  MeetingPointRouteRoute({
    Key? key,
    required String reference,
    List<PageRouteInfo>? children,
  }) : super(
         MeetingPointRouteRoute.name,
         args: MeetingPointRouteRouteArgs(key: key, reference: reference),
         rawPathParams: {'reference': reference},
         initialChildren: children,
       );

  static const String name = 'MeetingPointRouteRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final pathParams = data.inheritedPathParams;
      final args = data.argsAs<MeetingPointRouteRouteArgs>(
        orElse: () => MeetingPointRouteRouteArgs(
          reference: pathParams.getString('reference'),
        ),
      );
      return WrappedRoute(
        child: MeetingPointRoutePage(key: args.key, reference: args.reference),
      );
    },
  );
}

class MeetingPointRouteRouteArgs {
  const MeetingPointRouteRouteArgs({this.key, required this.reference});

  final Key? key;

  final String reference;

  @override
  String toString() {
    return 'MeetingPointRouteRouteArgs{key: $key, reference: $reference}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! MeetingPointRouteRouteArgs) return false;
    return key == other.key && reference == other.reference;
  }

  @override
  int get hashCode => key.hashCode ^ reference.hashCode;
}

/// generated route for
/// [MoreTabPage]
class MoreTabRoute extends PageRouteInfo<void> {
  const MoreTabRoute({List<PageRouteInfo>? children})
    : super(MoreTabRoute.name, initialChildren: children);

  static const String name = 'MoreTabRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const MoreTabPage();
    },
  );
}

/// generated route for
/// [MyBookingPage]
class MyBookingRoute extends PageRouteInfo<MyBookingRouteArgs> {
  MyBookingRoute({
    Key? key,
    required String reference,
    String? token,
    String? confirmee,
    List<PageRouteInfo>? children,
  }) : super(
         MyBookingRoute.name,
         args: MyBookingRouteArgs(
           key: key,
           reference: reference,
           token: token,
           confirmee: confirmee,
         ),
         rawPathParams: {'reference': reference},
         rawQueryParams: {'cle': token, 'confirmee': confirmee},
         initialChildren: children,
       );

  static const String name = 'MyBookingRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final pathParams = data.inheritedPathParams;
      final queryParams = data.queryParams;
      final args = data.argsAs<MyBookingRouteArgs>(
        orElse: () => MyBookingRouteArgs(
          reference: pathParams.getString('reference'),
          token: queryParams.optString('cle'),
          confirmee: queryParams.optString('confirmee'),
        ),
      );
      return WrappedRoute(
        child: MyBookingPage(
          key: args.key,
          reference: args.reference,
          token: args.token,
          confirmee: args.confirmee,
        ),
      );
    },
  );
}

class MyBookingRouteArgs {
  const MyBookingRouteArgs({
    this.key,
    required this.reference,
    this.token,
    this.confirmee,
  });

  final Key? key;

  final String reference;

  final String? token;

  final String? confirmee;

  @override
  String toString() {
    return 'MyBookingRouteArgs{key: $key, reference: $reference, token: $token, confirmee: $confirmee}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! MyBookingRouteArgs) return false;
    return key == other.key &&
        reference == other.reference &&
        token == other.token &&
        confirmee == other.confirmee;
  }

  @override
  int get hashCode =>
      key.hashCode ^ reference.hashCode ^ token.hashCode ^ confirmee.hashCode;
}

/// generated route for
/// [ParkingPage]
class ParkingRoute extends PageRouteInfo<ParkingRouteArgs> {
  ParkingRoute({
    Key? key,
    required String airport,
    required String parking,
    String? arrivee,
    String? retour,
    List<PageRouteInfo>? children,
  }) : super(
         ParkingRoute.name,
         args: ParkingRouteArgs(
           key: key,
           airport: airport,
           parking: parking,
           arrivee: arrivee,
           retour: retour,
         ),
         rawPathParams: {'airport': airport, 'parking': parking},
         rawQueryParams: {'arrivee': arrivee, 'retour': retour},
         initialChildren: children,
       );

  static const String name = 'ParkingRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final pathParams = data.inheritedPathParams;
      final queryParams = data.queryParams;
      final args = data.argsAs<ParkingRouteArgs>(
        orElse: () => ParkingRouteArgs(
          airport: pathParams.getString('airport'),
          parking: pathParams.getString('parking'),
          arrivee: queryParams.optString('arrivee'),
          retour: queryParams.optString('retour'),
        ),
      );
      return WrappedRoute(
        child: ParkingPage(
          key: args.key,
          airport: args.airport,
          parking: args.parking,
          arrivee: args.arrivee,
          retour: args.retour,
        ),
      );
    },
  );
}

class ParkingRouteArgs {
  const ParkingRouteArgs({
    this.key,
    required this.airport,
    required this.parking,
    this.arrivee,
    this.retour,
  });

  final Key? key;

  final String airport;

  final String parking;

  final String? arrivee;

  final String? retour;

  @override
  String toString() {
    return 'ParkingRouteArgs{key: $key, airport: $airport, parking: $parking, arrivee: $arrivee, retour: $retour}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! ParkingRouteArgs) return false;
    return key == other.key &&
        airport == other.airport &&
        parking == other.parking &&
        arrivee == other.arrivee &&
        retour == other.retour;
  }

  @override
  int get hashCode =>
      key.hashCode ^
      airport.hashCode ^
      parking.hashCode ^
      arrivee.hashCode ^
      retour.hashCode;
}

/// generated route for
/// [PaymentPage]
class PaymentRoute extends PageRouteInfo<PaymentRouteArgs> {
  PaymentRoute({
    Key? key,
    required String reference,
    List<PageRouteInfo>? children,
  }) : super(
         PaymentRoute.name,
         args: PaymentRouteArgs(key: key, reference: reference),
         rawPathParams: {'reference': reference},
         initialChildren: children,
       );

  static const String name = 'PaymentRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final pathParams = data.inheritedPathParams;
      final args = data.argsAs<PaymentRouteArgs>(
        orElse: () =>
            PaymentRouteArgs(reference: pathParams.getString('reference')),
      );
      return WrappedRoute(
        child: PaymentPage(key: args.key, reference: args.reference),
      );
    },
  );
}

class PaymentRouteArgs {
  const PaymentRouteArgs({this.key, required this.reference});

  final Key? key;

  final String reference;

  @override
  String toString() {
    return 'PaymentRouteArgs{key: $key, reference: $reference}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! PaymentRouteArgs) return false;
    return key == other.key && reference == other.reference;
  }

  @override
  int get hashCode => key.hashCode ^ reference.hashCode;
}

/// generated route for
/// [ProAccountPage]
class ProAccountRoute extends PageRouteInfo<void> {
  const ProAccountRoute({List<PageRouteInfo>? children})
    : super(ProAccountRoute.name, initialChildren: children);

  static const String name = 'ProAccountRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProAccountPage());
    },
  );
}

/// generated route for
/// [ProImportEmailPage]
class ProImportEmailRoute extends PageRouteInfo<void> {
  const ProImportEmailRoute({List<PageRouteInfo>? children})
    : super(ProImportEmailRoute.name, initialChildren: children);

  static const String name = 'ProImportEmailRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProImportEmailPage());
    },
  );
}

/// generated route for
/// [ProLoginPage]
class ProLoginRoute extends PageRouteInfo<void> {
  const ProLoginRoute({List<PageRouteInfo>? children})
    : super(ProLoginRoute.name, initialChildren: children);

  static const String name = 'ProLoginRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ProLoginPage();
    },
  );
}

/// generated route for
/// [ProMoreTabPage]
class ProMoreTabRoute extends PageRouteInfo<void> {
  const ProMoreTabRoute({List<PageRouteInfo>? children})
    : super(ProMoreTabRoute.name, initialChildren: children);

  static const String name = 'ProMoreTabRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ProMoreTabPage();
    },
  );
}

/// generated route for
/// [ProNotificationsPage]
class ProNotificationsRoute extends PageRouteInfo<void> {
  const ProNotificationsRoute({List<PageRouteInfo>? children})
    : super(ProNotificationsRoute.name, initialChildren: children);

  static const String name = 'ProNotificationsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProNotificationsPage());
    },
  );
}

/// generated route for
/// [ProOccupationPage]
class ProOccupationRoute extends PageRouteInfo<void> {
  const ProOccupationRoute({List<PageRouteInfo>? children})
    : super(ProOccupationRoute.name, initialChildren: children);

  static const String name = 'ProOccupationRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProOccupationPage());
    },
  );
}

/// generated route for
/// [ProParkingSettingsPage]
class ProParkingSettingsRoute extends PageRouteInfo<void> {
  const ProParkingSettingsRoute({List<PageRouteInfo>? children})
    : super(ProParkingSettingsRoute.name, initialChildren: children);

  static const String name = 'ProParkingSettingsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProParkingSettingsPage());
    },
  );
}

/// generated route for
/// [ProPlanPage]
class ProPlanRoute extends PageRouteInfo<void> {
  const ProPlanRoute({List<PageRouteInfo>? children})
    : super(ProPlanRoute.name, initialChildren: children);

  static const String name = 'ProPlanRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProPlanPage());
    },
  );
}

/// generated route for
/// [ProReservationFormPage]
class ProReservationFormRoute
    extends PageRouteInfo<ProReservationFormRouteArgs> {
  ProReservationFormRoute({
    Key? key,
    String? id,
    ReservationInput? initial,
    List<PageRouteInfo>? children,
  }) : super(
         ProReservationFormRoute.name,
         args: ProReservationFormRouteArgs(key: key, id: id, initial: initial),
         initialChildren: children,
       );

  static const String name = 'ProReservationFormRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<ProReservationFormRouteArgs>(
        orElse: () => const ProReservationFormRouteArgs(),
      );
      return WrappedRoute(
        child: ProReservationFormPage(
          key: args.key,
          id: args.id,
          initial: args.initial,
        ),
      );
    },
  );
}

class ProReservationFormRouteArgs {
  const ProReservationFormRouteArgs({this.key, this.id, this.initial});

  final Key? key;

  final String? id;

  final ReservationInput? initial;

  @override
  String toString() {
    return 'ProReservationFormRouteArgs{key: $key, id: $id, initial: $initial}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! ProReservationFormRouteArgs) return false;
    return key == other.key && id == other.id && initial == other.initial;
  }

  @override
  int get hashCode => key.hashCode ^ id.hashCode ^ initial.hashCode;
}

/// generated route for
/// [ProReservationPage]
class ProReservationRoute extends PageRouteInfo<ProReservationRouteArgs> {
  ProReservationRoute({
    Key? key,
    required String id,
    List<PageRouteInfo>? children,
  }) : super(
         ProReservationRoute.name,
         args: ProReservationRouteArgs(key: key, id: id),
         rawPathParams: {'id': id},
         initialChildren: children,
       );

  static const String name = 'ProReservationRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final pathParams = data.inheritedPathParams;
      final args = data.argsAs<ProReservationRouteArgs>(
        orElse: () => ProReservationRouteArgs(id: pathParams.getString('id')),
      );
      return WrappedRoute(
        child: ProReservationPage(key: args.key, id: args.id),
      );
    },
  );
}

class ProReservationRouteArgs {
  const ProReservationRouteArgs({this.key, required this.id});

  final Key? key;

  final String id;

  @override
  String toString() {
    return 'ProReservationRouteArgs{key: $key, id: $id}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! ProReservationRouteArgs) return false;
    return key == other.key && id == other.id;
  }

  @override
  int get hashCode => key.hashCode ^ id.hashCode;
}

/// generated route for
/// [ProReservationsPage]
class ProReservationsRoute extends PageRouteInfo<void> {
  const ProReservationsRoute({List<PageRouteInfo>? children})
    : super(ProReservationsRoute.name, initialChildren: children);

  static const String name = 'ProReservationsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProReservationsPage());
    },
  );
}

/// generated route for
/// [ProShellPage]
class ProShellRoute extends PageRouteInfo<void> {
  const ProShellRoute({List<PageRouteInfo>? children})
    : super(ProShellRoute.name, initialChildren: children);

  static const String name = 'ProShellRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ProShellPage();
    },
  );
}

/// generated route for
/// [ProShuttlePage]
class ProShuttleRoute extends PageRouteInfo<void> {
  const ProShuttleRoute({List<PageRouteInfo>? children})
    : super(ProShuttleRoute.name, initialChildren: children);

  static const String name = 'ProShuttleRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProShuttlePage());
    },
  );
}

/// generated route for
/// [ProSpotPlanningPage]
class ProSpotPlanningRoute extends PageRouteInfo<void> {
  const ProSpotPlanningRoute({List<PageRouteInfo>? children})
    : super(ProSpotPlanningRoute.name, initialChildren: children);

  static const String name = 'ProSpotPlanningRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProSpotPlanningPage());
    },
  );
}

/// generated route for
/// [ProTeamPage]
class ProTeamRoute extends PageRouteInfo<void> {
  const ProTeamRoute({List<PageRouteInfo>? children})
    : super(ProTeamRoute.name, initialChildren: children);

  static const String name = 'ProTeamRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProTeamPage());
    },
  );
}

/// generated route for
/// [ProTodayPage]
class ProTodayRoute extends PageRouteInfo<void> {
  const ProTodayRoute({List<PageRouteInfo>? children})
    : super(ProTodayRoute.name, initialChildren: children);

  static const String name = 'ProTodayRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProTodayPage());
    },
  );
}

/// generated route for
/// [ProVehiclesPage]
class ProVehiclesRoute extends PageRouteInfo<void> {
  const ProVehiclesRoute({List<PageRouteInfo>? children})
    : super(ProVehiclesRoute.name, initialChildren: children);

  static const String name = 'ProVehiclesRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ProVehiclesPage());
    },
  );
}

/// generated route for
/// [ResultsPage]
class ResultsRoute extends PageRouteInfo<ResultsRouteArgs> {
  ResultsRoute({
    Key? key,
    required String airport,
    String? arrivee,
    String? retour,
    List<PageRouteInfo>? children,
  }) : super(
         ResultsRoute.name,
         args: ResultsRouteArgs(
           key: key,
           airport: airport,
           arrivee: arrivee,
           retour: retour,
         ),
         rawPathParams: {'airport': airport},
         rawQueryParams: {'arrivee': arrivee, 'retour': retour},
         initialChildren: children,
       );

  static const String name = 'ResultsRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final pathParams = data.inheritedPathParams;
      final queryParams = data.queryParams;
      final args = data.argsAs<ResultsRouteArgs>(
        orElse: () => ResultsRouteArgs(
          airport: pathParams.getString('airport'),
          arrivee: queryParams.optString('arrivee'),
          retour: queryParams.optString('retour'),
        ),
      );
      return WrappedRoute(
        child: ResultsPage(
          key: args.key,
          airport: args.airport,
          arrivee: args.arrivee,
          retour: args.retour,
        ),
      );
    },
  );
}

class ResultsRouteArgs {
  const ResultsRouteArgs({
    this.key,
    required this.airport,
    this.arrivee,
    this.retour,
  });

  final Key? key;

  final String airport;

  final String? arrivee;

  final String? retour;

  @override
  String toString() {
    return 'ResultsRouteArgs{key: $key, airport: $airport, arrivee: $arrivee, retour: $retour}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! ResultsRouteArgs) return false;
    return key == other.key &&
        airport == other.airport &&
        arrivee == other.arrivee &&
        retour == other.retour;
  }

  @override
  int get hashCode =>
      key.hashCode ^ airport.hashCode ^ arrivee.hashCode ^ retour.hashCode;
}

/// generated route for
/// [SearchTabPage]
class SearchTabRoute extends PageRouteInfo<void> {
  const SearchTabRoute({List<PageRouteInfo>? children})
    : super(SearchTabRoute.name, initialChildren: children);

  static const String name = 'SearchTabRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const SearchTabPage());
    },
  );
}

/// generated route for
/// [TripsTabPage]
class TripsTabRoute extends PageRouteInfo<void> {
  const TripsTabRoute({List<PageRouteInfo>? children})
    : super(TripsTabRoute.name, initialChildren: children);

  static const String name = 'TripsTabRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const TripsTabPage();
    },
  );
}

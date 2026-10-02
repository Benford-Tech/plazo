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

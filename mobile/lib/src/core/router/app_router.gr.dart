// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'app_router.dart';

/// generated route for
/// [HomePage]
class HomeRoute extends PageRouteInfo<void> {
  const HomeRoute({List<PageRouteInfo>? children})
    : super(HomeRoute.name, initialChildren: children);

  static const String name = 'HomeRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const HomePage();
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
    List<PageRouteInfo>? children,
  }) : super(
         MyBookingRoute.name,
         args: MyBookingRouteArgs(key: key, reference: reference, token: token),
         rawPathParams: {'reference': reference},
         rawQueryParams: {'cle': token},
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
        ),
      );
      return WrappedRoute(
        child: MyBookingPage(
          key: args.key,
          reference: args.reference,
          token: args.token,
        ),
      );
    },
  );
}

class MyBookingRouteArgs {
  const MyBookingRouteArgs({this.key, required this.reference, this.token});

  final Key? key;

  final String reference;

  final String? token;

  @override
  String toString() {
    return 'MyBookingRouteArgs{key: $key, reference: $reference, token: $token}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! MyBookingRouteArgs) return false;
    return key == other.key &&
        reference == other.reference &&
        token == other.token;
  }

  @override
  int get hashCode => key.hashCode ^ reference.hashCode ^ token.hashCode;
}

/// generated route for
/// [OpenBookingPage]
class OpenBookingRoute extends PageRouteInfo<void> {
  const OpenBookingRoute({List<PageRouteInfo>? children})
    : super(OpenBookingRoute.name, initialChildren: children);

  static const String name = 'OpenBookingRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const OpenBookingPage());
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

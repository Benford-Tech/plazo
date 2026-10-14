part of 'locator.dart';

void _initBlocs() {
  locator
    // One per screen.
    ..registerFactory(() => BookingBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => SearchBloc(locator(), preview: locator(), live: locator()))
    // Shared by the search tab, "Mes réservations" and the pages that change a booking.
    ..registerLazySingleton(() => TripsBloc(locator()))
    ..registerFactory(() => ManageBookingBloc(locator(), locator()))
    ..registerFactory(() => CarLocationBloc(locator(), locator(), locator()))
    // Screens opened with parameters (airport, parking, dates, reference).
    ..registerFactoryParam<ResultsBloc, StayParams, void>(
      (p, _) => ResultsBloc(locator(), airport: p.airport, arrivalAt: p.arrivalAt!, returnAt: p.returnAt!, live: locator()),
    )
    ..registerFactoryParam<ParkingBloc, StayParams, void>(
      (p, _) => ParkingBloc(locator(), airport: p.airport, slug: p.parking!, arrivalAt: p.arrivalAt, returnAt: p.returnAt),
    )
    ..registerFactoryParam<BookingFormBloc, StayParams, void>(
      (p, _) => BookingFormBloc(locator(), locator(), locator(), airport: p.airport, parking: p.parking!, arrivalAt: p.arrivalAt!, returnAt: p.returnAt!),
    )
    ..registerFactoryParam<PaymentBloc, String, void>(
      (reference, _) => PaymentBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator(), locator(), reference: reference),
    )
    ..registerFactory(() => ArrivalBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(() => ReturnBloc(locator(), locator(), locator(), notice: locator()))
    ..registerFactory(() => MeetingRouteBloc(locator(), locator(), locator(), locator()))
    // The driver's planning hands « Embarquer » / « Récupérer » to the Navette tab's list (14/10/2026).
    ..registerLazySingleton(ShuttleBoardingRequests.new)
    ..registerFactory(
      () => ShuttleBloc(
        locator(),
        locator(),
        locator(),
        locator(),
        locator(),
        locator(),
        locator(),
        locator(),
        locator(),
        staying: locator(),
        boarding: locator(),
        pollInterval: AppConstants.livePollInterval,
      ),
    )
    ..registerFactory(() => LiveShuttlesBloc(locator(), pollInterval: AppConstants.livePollInterval))
    ..registerFactory(() => ShuttleWavesBloc(locator()))
    ..registerFactory(() => ProVehiclesBloc(locator(), locator(), locator(), locator()))
    ..registerFactory(() => StayShuttlesBloc(locator(), enablePushes: locator(), pollInterval: AppConstants.livePollInterval))
    ..registerFactory(() => ProPlanBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProOccupationBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator(), location: locator()))
    ..registerFactory(() => ProReservationsBloc(locator()))
    ..registerFactory(() => ProReservationBloc(locator(), locator()))
    ..registerFactory(() => ProSpotPlanningBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(
      () => ProTeamBloc(
        locator(),
        locator(),
        locator(),
        locator(),
        joinCode: locator(),
        joinRequests: locator(),
        accept: locator(),
        refuse: locator(),
        pushOpened: locator<PushService>().opened,
      ),
    )
    ..registerFactoryParam<ProJoinBloc, OnboardingModel?, void>((initial, _) => ProJoinBloc(locator(), locator(), locator(), locator(), initial: initial))
    ..registerFactory(() => ProSettingsBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator(), locator(), locator()))
    ..registerFactory(() => ProTodayBloc(locator(), locator(), pollInterval: AppConstants.livePollInterval))
    ..registerFactory(() => ProDashboardBloc(locator()))
    ..registerFactory(() => RevenueSummaryBloc(locator(), changes: locator<RevenueRepository>().changes))
    ..registerFactory(() => ProRevenueBloc(locator(), locator()))
    ..registerFactory(() => ProNotificationsBloc(locator(), locator(), locator()))
    // The staff session lives as long as the app (the router's guard reads it).
    ..registerLazySingleton(() => ProAuthBloc(locator(), locator(), locator(), locator(), locator(), locator(), locator(), identity: locator()))
    ..registerLazySingleton(() => ProAuthGuard(locator()))
    ..registerLazySingleton(() => AppRouter(proGuard: locator()));
}

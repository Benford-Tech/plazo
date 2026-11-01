part of 'locator.dart';

void _initDataSource() {
  locator
    ..registerLazySingleton<BookingDataSource>(() => BookingDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<AppLinkDataSource>(() => AppLinkDataSourceImpl(locator()))
    ..registerLazySingleton<PublicDataSource>(() => PublicDataSourceImpl(locator()))
    ..registerLazySingleton<ArrivalDataSource>(() => ArrivalDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<AuthDataSource>(() => AuthDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<OnboardingDataSource>(() => OnboardingDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<PlanningDataSource>(() => PlanningDataSourceImpl(locator()))
    ..registerLazySingleton<DashboardDataSource>(() => DashboardDataSourceImpl(locator()))
    ..registerLazySingleton<RevenueDataSource>(() => RevenueDataSourceImpl(locator()))
    ..registerLazySingleton<GettingStartedDataSource>(() => GettingStartedDataSourceImpl(locator()))
    ..registerLazySingleton<ForecastDataSource>(() => ForecastDataSourceImpl(locator()))
    ..registerLazySingleton<ValetRunsDataSource>(() => ValetRunsDataSourceImpl(locator()))
    ..registerLazySingleton<ExtrasBoardDataSource>(() => ExtrasBoardDataSourceImpl(locator()))
    ..registerLazySingleton<LinkedEmailsDataSource>(() => LinkedEmailsDataSourceImpl(locator()))
    ..registerLazySingleton<KeysDataSource>(() => KeysDataSourceImpl(locator()))
    ..registerLazySingleton<NotificationsDataSource>(() => NotificationsDataSourceImpl(locator(), locator()))
    ..registerLazySingleton<ReturnDataSource>(() => ReturnDataSourceImpl(locator(), locator(), locator()))
    ..registerLazySingleton<ShuttleDataSource>(() => ShuttleDataSourceImpl(locator()))
    ..registerLazySingleton<PlanDataSource>(() => PlanDataSourceImpl(locator()))
    ..registerLazySingleton<OccupationDataSource>(() => OccupationDataSourceImpl(locator()))
    ..registerLazySingleton<ReservationsDataSource>(() => ReservationsDataSourceImpl(locator()))
    ..registerLazySingleton<SpotPlanningDataSource>(() => SpotPlanningDataSourceImpl(locator()))
    ..registerLazySingleton<SettingsDataSource>(() => SettingsDataSourceImpl(locator()))
    ..registerLazySingleton<StaffPhotoDataSource>(() => StaffPhotoDataSourceImpl(locator()))
    ..registerLazySingleton<PaperworkDataSource>(() => PaperworkDataSourceImpl(locator(), locator(), locator()))
    ..registerLazySingleton<ExtrasDataSource>(() => ExtrasDataSourceImpl(locator(), locator()));
}

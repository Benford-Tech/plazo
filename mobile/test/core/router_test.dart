import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/router/app_router.dart';
import 'package:parking_app/src/core/router/pro_auth_guard.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';

class MockAuth extends Mock implements ProAuthBloc {}

void main() {
  final router = AppRouter(proGuard: ProAuthGuard(MockAuth()));
  List<String>? names(String path) => router.matcher.match(path)?.map((m) => m.name).toList();
  List<String>? tab(String path) => router.matcher.match(path)?.expand((m) => [m.name, ...?m.children?.map((c) => c.name)]).toList();

  test('une seule app : trois onglets (Rechercher, Mes réservations, Plus) sous « / »', () {
    expect(tab('/'), [AppShellRoute.name, SearchTabRoute.name]);
    expect(tab('/ma-reservation'), [AppShellRoute.name, TripsTabRoute.name]);
    expect(tab('/plus'), [AppShellRoute.name, MoreTabRoute.name]);
  });

  test('les liens du site ouvrent l’app : mêmes chemins, parcours pro inchangé', () {
    final link = router.matcher.match('/ma-reservation/R7KQ2M?cle=abc');
    expect(link?.last.name, MyBookingRoute.name);
    expect(link?.last.params.getString('reference'), 'R7KQ2M');
    expect(link?.last.queryParams.optString('cle'), 'abc');
    expect(names('/ma-reservation/R7KQ2M/paiement')?.last, PaymentRoute.name);
    expect(names('/pro')?.last, ProTodayRoute.name);
    expect(names('/pro/connexion')?.last, ProLoginRoute.name);
    expect(names('/pro/notifications')?.last, ProNotificationsRoute.name);
    expect(names('/pro/navette')?.last, ProShuttleRoute.name);
    expect(names('/ma-reservation/R7KQ2M/point-de-rendez-vous')?.last, MeetingPointRouteRoute.name);
    final results = router.matcher.match('/lyon-saint-exupery/recherche?arrivee=2026-10-03T08:00&retour=2026-10-10T18:00');
    expect(results?.last.name, ResultsRoute.name);
    expect(results?.last.queryParams.optString('arrivee'), '2026-10-03T08:00');
    expect(names('/lyon-saint-exupery/parking-demo-lys')?.last, ParkingRoute.name);
    expect(names('/lyon-saint-exupery/parking-demo-lys/reserver')?.last, BookingFormRoute.name);
  });
}

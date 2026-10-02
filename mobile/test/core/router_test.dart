import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/router/app_router.dart';
import 'package:parking_app/src/core/router/pro_auth_guard.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';

class MockAuth extends Mock implements ProAuthBloc {}

void main() {
  test('les liens du site ouvrent l’app : mêmes chemins, deux parcours séparés', () {
    final router = AppRouter(proGuard: ProAuthGuard(MockAuth()));
    final paths = router.routes.map((r) => r.path).toList();
    expect(paths, containsAll(['/', '/ma-reservation', '/ma-reservation/:reference', '/pro', '/pro/connexion', '/pro/notifications']));
    final link = router.matcher.match('/ma-reservation/R7KQ2M?cle=abc');
    expect(link?.last.name, MyBookingRoute.name);
    expect(link?.last.params.getString('reference'), 'R7KQ2M');
    expect(link?.last.queryParams.optString('cle'), 'abc');
  });
}

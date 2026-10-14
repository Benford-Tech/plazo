import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_occupation/data/models/occupation_models.dart';
import 'package:parking_app/src/features/pro_occupation/presentation/bloc/pro_occupation_bloc.dart';
import 'package:parking_app/src/features/pro_occupation/presentation/pages/pro_occupation_page.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';

import '../../helpers/pump_app.dart';

class MockOccupationBloc extends MockBloc<ProOccupationEvent, ProOccupationState> implements ProOccupationBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// « Embarquer en un geste » (14/10/2026), the valet's side: a car checked in at boarding waits among the arrivals to put
/// away, with who checked it in, by spot and by file.
void main() {
  setUpAll(setUpLocalizedTests);

  const valet = StaffModel(id: 'v1', name: 'Paul Martin', email: 'p@example.com', role: 'valet', post: 'valet', effectivePost: 'valet');
  final boarded = OccupantModel(
    id: 'r1',
    reference: 'PLZ-R1',
    customerName: 'Vincent Blanc',
    plate: 'DJ-150-MX',
    status: 'arrived',
    arrivalAt: '2026-10-14T09:45',
    returnAt: '2026-10-17T18:00',
    boardingCheckIn: BoardingCheckInModel(driverFirstName: 'Karim', at: DateTime.utc(2026, 10, 14, 7, 47)),
  );
  final anonymous = boarded.copyWith(id: 'r2', reference: 'PLZ-R2', plate: 'KL-204-BA', boardingCheckIn: BoardingCheckInModel(at: DateTime.utc(2026, 10, 14, 7, 47)));
  const desk = OccupantModel(id: 'r3', reference: 'PLZ-R3', customerName: 'Chloé Moreau', plate: 'BN-655-RT', status: 'arrived', arrivalAt: '2026-10-14T08:00', returnAt: '2026-10-16T18:00');

  Future<void> show(WidgetTester tester, ProOccupationState state) async {
    final bloc = MockOccupationBloc();
    whenListen(bloc, const Stream<ProOccupationState>.empty(), initialState: state);
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: valet));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProOccupationBloc>.value(value: bloc),
          BlocProvider<ProAuthBloc>.value(value: auth),
        ],
        child: const ProOccupationPage(),
      ),
      size: const Size(400, 1800),
    );
  }

  testWidgets('par places : « Pointé à l\'embarquement par Karim », sans prénom, et rien pour un pointage à l\'accueil', (tester) async {
    await show(
      tester,
      ProOccupationState(
        board: OccupationBoardModel(date: '2026-10-14', arrivals: [boarded, anonymous, desk], stats: const OccupationStatsModel(active: 0, occupied: 0, leavingToday: 0)),
      ),
    );
    expect(find.text('Pointé à l\'embarquement par Karim'), findsOneWidget);
    expect(find.byKey(const Key('boarded-PLZ-R2')), findsOneWidget);
    expect(find.text('Pointé à l\'embarquement'), findsOneWidget);
    expect(find.byKey(const Key('boarded-PLZ-R3')), findsNothing);
  });

  testWidgets('par files : la même ligne sur l\'arrivée à ranger', (tester) async {
    await show(
      tester,
      ProOccupationState(
        fileBoard: FileBoardModel(
          date: '2026-10-14',
          files: const [FileViewModel(id: 'f1', code: 'F07', capacity: 4)],
          arrivals: [boarded, desk],
          stats: const FileStatsModel(files: 1, capacity: 4),
        ),
      ),
    );
    expect(find.byKey(const Key('files-summary')), findsOneWidget);
    expect(find.text('Pointé à l\'embarquement par Karim'), findsOneWidget);
    expect(find.byKey(const Key('boarded-PLZ-R3')), findsNothing);
  });
}

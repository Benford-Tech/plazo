import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_occupation/data/models/occupation_models.dart';
import 'package:parking_app/src/features/pro_occupation/presentation/bloc/pro_occupation_bloc.dart';
import 'package:parking_app/src/features/pro_occupation/presentation/pages/pro_occupation_page.dart';

import '../../helpers/pump_app.dart';

class MockOccupationBloc extends MockBloc<ProOccupationEvent, ProOccupationState> implements ProOccupationBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// 15/10/2026 (« ne pas planter à l'import quand la plaque est manquante »): a car imported without its plate is « Véhicule »
/// in the Occupation's notices (« Voiture » in a file), as on the web.
void main() {
  setUpAll(setUpLocalizedTests);

  const valet = StaffModel(id: 'v1', name: 'Paul Martin', email: 'p@example.com', role: 'valet', post: 'valet', effectivePost: 'valet');
  const initial = ProOccupationState(
    board: OccupationBoardModel(date: '2026-10-14', arrivals: [], stats: OccupationStatsModel(active: 0, occupied: 0, leavingToday: 0)),
  );

  for (final (notice, text) in [
    ('occupation.placed::A-01', 'Véhicule placé en A-01'),
    ('occupation.filed::F07', 'Voiture rangée en F07'),
    ('occupation.released:', 'Le véhicule n\'a plus de place'),
    ('occupation.placed:AB-123-CD:A-01', 'AB-123-CD placé en A-01'),
  ]) {
    testWidgets('« $text »', (tester) async {
      final states = StreamController<ProOccupationState>();
      final bloc = MockOccupationBloc();
      whenListen(bloc, states.stream, initialState: initial);
      final auth = MockAuthBloc();
      whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: valet));
      await pumpLocalized(
        tester,
        MultiBlocProvider(
          providers: [BlocProvider<ProOccupationBloc>.value(value: bloc), BlocProvider<ProAuthBloc>.value(value: auth)],
          child: const ProOccupationPage(),
        ),
        size: const Size(400, 800),
      );
      states.add(initial.copyWith(notice: notice));
      await tester.pump();
      await tester.pump();
      expect(find.text(text), findsOneWidget);
      await states.close();
    });
  }
}

import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/paperwork/presentation/bloc/paperwork_bloc.dart';

class QuietPaperworkBloc extends MockBloc<PaperworkEvent, PaperworkState> implements PaperworkBloc {}

/// The « Contrat et état des lieux » card of a booking's sheet (19/10/2026) stays hidden in the tests of other features:
/// its bloc never loads anything.
void registerQuietPaperwork() {
  locator.registerFactory<PaperworkBloc>(() {
    final bloc = QuietPaperworkBloc();
    when(() => bloc.state).thenReturn(const PaperworkState());
    return bloc;
  });
}

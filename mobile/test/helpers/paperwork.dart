import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/extra_settings_bloc.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/staff_extras_bloc.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/traveller_extras_bloc.dart';
import 'package:parking_app/src/features/paperwork/presentation/bloc/paperwork_bloc.dart';

class QuietPaperworkBloc extends MockBloc<PaperworkEvent, PaperworkState> implements PaperworkBloc {}

class QuietStaffExtrasBloc extends MockBloc<StaffExtrasEvent, StaffExtrasState> implements StaffExtrasBloc {}

class QuietTravellerExtrasBloc extends MockBloc<TravellerExtrasEvent, TravellerExtrasState> implements TravellerExtrasBloc {}

class QuietExtraSettingsBloc extends MockBloc<ExtraSettingsEvent, ExtraSettingsState> implements ExtraSettingsBloc {}

/// The « Contrat et état des lieux » card of a booking's sheet (19/10/2026) stays hidden in the tests of other features:
/// its bloc never loads anything. Same for the services for the car (21/10/2026).
void registerQuietPaperwork() {
  locator.registerFactory<PaperworkBloc>(() {
    final bloc = QuietPaperworkBloc();
    when(() => bloc.state).thenReturn(const PaperworkState());
    return bloc;
  });
  registerQuietExtras();
}

/// The services for the car (21/10/2026) stay hidden: their blocs never load anything.
void registerQuietExtras() {
  if (!locator.isRegistered<StaffExtrasBloc>()) {
    locator.registerFactory<StaffExtrasBloc>(() {
      final bloc = QuietStaffExtrasBloc();
      when(() => bloc.state).thenReturn(const StaffExtrasState());
      return bloc;
    });
  }
  if (!locator.isRegistered<TravellerExtrasBloc>()) {
    locator.registerFactory<TravellerExtrasBloc>(() {
      final bloc = QuietTravellerExtrasBloc();
      when(() => bloc.state).thenReturn(const TravellerExtrasState());
      return bloc;
    });
  }
  if (!locator.isRegistered<ExtraSettingsBloc>()) {
    locator.registerFactory<ExtraSettingsBloc>(() {
      final bloc = QuietExtraSettingsBloc();
      when(() => bloc.state).thenReturn(const ExtraSettingsState());
      return bloc;
    });
  }
}

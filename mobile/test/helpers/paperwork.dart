import 'dart:typed_data';

import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/extra_settings_bloc.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/staff_extras_bloc.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/traveller_extras_bloc.dart';
import 'package:parking_app/src/features/paperwork/presentation/bloc/paperwork_bloc.dart';
import 'package:parking_app/src/features/pro_settings/data/staff_photo_data_source.dart';

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
  registerQuietStaffPhoto();
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

/// « Ma photo » of Mon compte (30/10/2026): no photo, nothing sent; records what the card asks for.
class FakeStaffPhoto implements StaffPhotoDataSource {
  DateTime? photoUpdatedAt;
  bool demo = false;
  final uploads = <Uint8List>[];
  int removals = 0;
  final loads = <String>[];

  @override
  Future<({DateTime? photoUpdatedAt, bool demo})> mine() async => (photoUpdatedAt: photoUpdatedAt, demo: demo);

  @override
  Future<void> upload(Uint8List bytes) async {
    uploads.add(bytes);
    photoUpdatedAt = DateTime.utc(2026, 10, 30, 9);
  }

  @override
  Future<void> remove() async {
    removals++;
    photoUpdatedAt = null;
  }

  @override
  Future<Uint8List?> load(String staffId, DateTime updatedAt) async {
    loads.add(staffId);
    return null;
  }
}

/// Mon compte's photo card in the tests of other parts of the page.
void registerQuietStaffPhoto() {
  if (!locator.isRegistered<StaffPhotoDataSource>()) locator.registerSingleton<StaffPhotoDataSource>(FakeStaffPhoto());
}

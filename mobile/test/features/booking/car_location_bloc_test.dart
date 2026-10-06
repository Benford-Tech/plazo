import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/domain/usecases/booking_actions_use_cases.dart';
import 'package:parking_app/src/features/booking/presentation/bloc/car_location_bloc.dart';
import 'package:parking_app/src/services/location_service.dart';

import '../../helpers/fakes.dart';

/// "Ma voiture" (06/10/2026): the traveller records where they parked.

class MockLocate extends Mock implements LocateCarUseCase {}

class MockClear extends Mock implements ClearCarUseCase {}

class MockLocation extends Mock implements LocationService {}

void main() {
  late MockLocate locate;
  late MockClear clear;
  late MockLocation location;
  final fix = GeoPosition(lat: 45.7301, lng: 5.0502, accuracy: 6, recordedAt: DateTime(2026, 10, 6, 8, 42));

  setUpAll(() {
    registerFallbackValue(LocateCarParams(reference: '', position: fix));
  });

  setUp(() {
    locate = MockLocate();
    clear = MockClear();
    location = MockLocation();
  });

  test('demande la permission, prend une position, l’envoie avec la note', () async {
    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.granted);
    when(() => location.current()).thenAnswer((_) async => fix);
    final saved = booking().copyWith(
      car: CarLocationModel(lat: fix.lat, lng: fix.lng, accuracyM: 6, at: fix.recordedAt, note: 'Rangée 3'),
    );
    when(() => locate(any())).thenAnswer((_) async => Right(saved));
    final bloc = CarLocationBloc(locate, clear, location)..add(const CarLocationRequested(reference: 'R7KQ2M', note: 'Rangée 3'));
    await bloc.stream.firstWhere((s) => !s.viewState.isProcessing);
    expect(bloc.state.viewState, ViewState.success);
    expect(bloc.state.booking?.car?.note, 'Rangée 3');
    final params = verify(() => locate(captureAny())).captured.single as LocateCarParams;
    expect(params.position, fix);
    expect(params.note, 'Rangée 3');
    await bloc.close();
  });

  test('sans permission ni signal : erreur lisible, rien n’est envoyé', () async {
    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.deniedForever);
    final denied = CarLocationBloc(locate, clear, location)..add(const CarLocationRequested(reference: 'R7KQ2M'));
    await denied.stream.firstWhere((s) => s.viewState.isError);
    expect(denied.state.locationProblem, LocationAccess.deniedForever);
    verifyNever(() => locate(any()));
    await denied.close();

    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.granted);
    when(() => location.current()).thenAnswer((_) async => null);
    final noFix = CarLocationBloc(locate, clear, location)..add(const CarLocationRequested(reference: 'R7KQ2M'));
    await noFix.stream.firstWhere((s) => s.viewState.isError);
    expect(noFix.state.noFix, isTrue);
    await noFix.close();
  });

  test('la position prise par le voiturier ne se remplace pas : 409 car_location_locked', () async {
    when(() => location.requestAccess()).thenAnswer((_) async => LocationAccess.granted);
    when(() => location.current()).thenAnswer((_) async => fix);
    when(() => locate(any())).thenAnswer((_) async => const Left(ServerFailure(code: 'car_location_locked', statusCode: 409)));
    final bloc = CarLocationBloc(locate, clear, location)..add(const CarLocationRequested(reference: 'R7KQ2M'));
    await bloc.stream.firstWhere((s) => s.viewState.isError);
    expect(bloc.state.errorCode, 'car_location_locked');
    when(() => clear('R7KQ2M')).thenAnswer((_) async => Right(booking()));
    bloc.add(const CarLocationCleared('R7KQ2M'));
    await bloc.stream.firstWhere((s) => s.viewState.isSuccess);
    expect(bloc.state.booking?.car, isNull);
    await bloc.close();
  });
}

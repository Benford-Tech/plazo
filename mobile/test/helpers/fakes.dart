import 'package:dio/dio.dart';
import 'package:parking_app/src/core/error/exceptions.dart';
import 'package:parking_app/src/features/booking/data/datasources/booking_data_source.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/search/data/datasources/public_data_source.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/services/payment_sheet_service.dart';
import 'package:parking_app/src/services/location_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

/// An API error as the repositories receive it (code, fields, details).
class ApiError implements Exception {
  const ApiError(this.code, {this.fields, this.details, this.status = 409});
  final String code;
  final Map<String, String>? fields;
  final Map<String, dynamic>? details;
  final int status;

  /// What Dio throws for this answer of the API ({ message, code, fields, details }).
  DioException toDio() {
    final options = RequestOptions(path: 'public/bookings');
    return DioException(
      requestOptions: options,
      type: DioExceptionType.badResponse,
      response: Response(
        requestOptions: options,
        statusCode: status,
        data: <String, dynamic>{'message': code, 'code': code, 'fields': ?fields, 'details': ?details},
      ),
    );
  }
}

PublicBookingModel booking({
  String reference = 'R7KQ2M',
  String status = 'upcoming',
  String paymentMode = 'online',
  BookingPaymentModel? payment,
  String arrivalAt = '2026-10-10T08:00',
  String returnAt = '2026-10-17T18:00',
  String? returnFlight,
  bool canCancel = true,
  bool canEditFlight = true,
  String? cancellableUntil = '2026-10-09T08:00',
  String cancellationPolicy = 'free_24h',
  int? priceCents = 4500,
}) => PublicBookingModel(
  reference: reference,
  status: status,
  paymentMode: paymentMode,
  payment: payment,
  parking: const BookingParkingModel(
    title: 'Parking Démo LYS',
    slug: 'parking-demo-lys',
    address: '12 route de l’Aéroport',
    phone: '04 72 00 00 00',
    airport: BookingAirportModel(slug: 'lyon-saint-exupery', name: 'Lyon Saint-Exupéry'),
  ),
  arrivalAt: arrivalAt,
  returnAt: returnAt,
  customerName: 'Camille Martin',
  customerEmail: 'camille@exemple.fr',
  customerPhone: '06 12 34 56 78',
  plate: 'AB-123-CD',
  returnFlight: returnFlight,
  passengers: 2,
  days: 8,
  priceCents: priceCents,
  cancellationPolicy: cancellationPolicy,
  cancellableUntil: cancellableUntil,
  canCancel: canCancel,
  canEditFlight: canEditFlight,
);

/// The booking API over a real (in-memory) secure storage: every call is recorded, answers are
/// queued per method (a value, or an [ApiError] thrown as the API's error).
class FakeBookingDataSource implements BookingDataSource {
  FakeBookingDataSource(this.storage);

  final SecureStorageService storage;
  final calls = <String>[];
  final Map<String, List<Object>> answers = {};
  final Map<String, PublicBookingModel> bookings = {};
  BookingInput? lastInput;

  void answer(String method, Object value) => (answers[method] ??= []).add(value);

  Future<T> _next<T>(String method, T Function() fallback) async {
    calls.add(method);
    final queue = answers[method];
    final value = queue == null || queue.isEmpty ? null : (queue.length > 1 ? queue.removeAt(0) : queue.first);
    if (value is ApiError) throw value.toDio();
    if (value == null) return fallback();
    return value as T;
  }

  @override
  Future<CreatedBookingModel> create(BookingInput input) async {
    lastInput = input;
    final created = await _next<CreatedBookingModel>('create', () => throw StateError('no answer'));
    await storage.saveBookingToken(created.reference, created.manageToken);
    return created;
  }

  @override
  Future<BookingAccessModel> lookup({required String reference, required String email}) async {
    final access = await _next<BookingAccessModel>('lookup', () {
      if (email != 'camille@exemple.fr') throw const ServerException(code: 'not_found');
      return BookingAccessModel(reference: reference.toUpperCase(), manageToken: 'token-lookup');
    });
    await storage.saveBookingToken(access.reference, access.manageToken);
    return access;
  }

  @override
  Future<PublicBookingModel> getBooking({required String reference}) async {
    if (await storage.bookingToken(reference) == null) throw const ServerException(code: 'not_found');
    return _next('get', () => bookings[reference.toUpperCase()] ?? (throw const ApiError('not_found', status: 404).toDio()));
  }

  @override
  Future<PublicBookingModel> updateFlight({required String reference, required String? flight}) =>
      _next('flight', () => booking(reference: reference, returnFlight: flight));

  @override
  Future<PublicBookingModel> locateCar({required String reference, required GeoPosition position, String? note}) => _next(
    'locateCar',
    () => booking(reference: reference).copyWith(
      car: CarLocationModel(lat: position.lat, lng: position.lng, accuracyM: position.accuracy?.round(), at: position.recordedAt, note: note),
    ),
  );

  @override
  Future<PublicBookingModel> clearCar({required String reference}) => _next('clearCar', () => booking(reference: reference));

  @override
  Future<PaymentIntentModel> paymentIntent({required String reference}) => _next(
    'intent',
    () => const PaymentIntentModel(clientSecret: 'pi_1_secret', paymentIntentId: 'pi_1', amountCents: 4500, currency: 'eur'),
  );

  @override
  Future<CheckoutModel> checkout({required String reference}) => _next('checkout', () => const CheckoutModel(url: 'https://checkout.stripe.test/c/pay/cs_1'));

  @override
  Future<PublicBookingModel> release({required String reference}) => _next(
    'release',
    () => booking(reference: reference, status: 'cancelled', paymentMode: 'online', payment: const BookingPaymentModel(status: 'expired')),
  );

  @override
  Future<PublicBookingModel> cancel({required String reference}) => _next('cancel', () => booking(reference: reference, status: 'cancelled'));

  @override
  Future<void> saveAccess({required String reference, required String token}) => storage.saveBookingToken(reference, token);

  @override
  Future<List<String>> savedReferences() => storage.bookingReferences();

  @override
  Future<void> forget({required String reference}) => storage.forgetBooking(reference);
}

const lys = AirportModel(code: 'LYS', name: 'Lyon Saint-Exupéry', slug: 'lyon-saint-exupery', location: LatLngModel(lat: 45.7256, lng: 5.0811));

SearchResultModel result(
  String slug, {
  int? priceCents = 4500,
  bool available = true,
  int? shuttle = 8,
  double? km = 3.5,
  List<String> services = const ['shuttle'],
  String policy = 'free_24h',
  String payment = 'online',
  LatLngModel? location = const LatLngModel(lat: 45.7375, lng: 5.0745),
}) => SearchResultModel(
  slug: slug,
  title: 'Parking $slug',
  services: services,
  shuttleMinutes: shuttle,
  distanceKm: km,
  cancellationPolicy: policy,
  payment: payment,
  location: location,
  available: available,
  days: 8,
  priceCents: priceCents,
);

ParkingResponseModel parkingResponse({String payment = 'online', OfferModel? offer = const OfferModel(available: true, days: 8, priceCents: 4500)}) =>
    ParkingResponseModel(
      payments: payment == 'online' ? 'online' : 'unavailable',
      airport: lys,
      parking: ParkingDetailModel(
        slug: 'parking-demo-lys',
        title: 'Parking Démo LYS',
        services: const ['shuttle', 'fenced', 'cctv'],
        shuttleMinutes: 8,
        distanceKm: 3.5,
        cancellationPolicy: 'free_24h',
        payment: payment,
        address: '12 route de l’Aéroport',
        pricing: const PricingModel(tiers: [PricingTierModel(days: 1, priceCents: 1500), PricingTierModel(days: 8, priceCents: 4500)], extraDayPriceCents: 500),
      ),
      offer: offer,
    );

class FakePublicDataSource implements PublicDataSource {
  List<AirportModel> airportList = const [lys];
  SearchResponseModel searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('a')]);
  ParkingResponseModel parking_ = parkingResponse();
  PaymentsConfigModel config = const PaymentsConfigModel(payments: 'online', publishableKey: 'pk_test_1');
  Object? searchError;
  final searches = <String>[];

  @override
  Future<List<AirportModel>> airports() async => airportList;

  @override
  Future<SearchResponseModel> search({required String airport, required String arrivalAt, required String returnAt}) async {
    searches.add('$airport $arrivalAt $returnAt');
    if (searchError != null) throw searchError!;
    return searchResponse;
  }

  @override
  Future<ParkingResponseModel> parking({required String airport, required String slug, String? arrivalAt, String? returnAt}) async => parking_;

  @override
  Future<PaymentsConfigModel> paymentsConfig() async => config;
}

class FakePaymentSheet implements PaymentSheetService {
  FakePaymentSheet({this.supported = true, this.outcome = const PaymentSheetOutcome(PaymentSheetResult.completed)});

  @override
  bool supported;
  PaymentSheetOutcome outcome;
  final presented = <String>[];

  /// Runs while the sheet is "open" (e.g. the payment goes through on the server).
  void Function()? onPresent;

  @override
  Future<PaymentSheetOutcome> present({
    required String publishableKey,
    required String clientSecret,
    required String merchantDisplayName,
    required String merchantCountryCode,
    required String currency,
    String? amountLabel,
  }) async {
    presented.add(clientSecret);
    onPresent?.call();
    return outcome;
  }
}

class FakeLinks extends LinkService {
  final opened = <Uri>[];
  final redirected = <Uri>[];

  @override
  Future<bool> open(Uri uri) async {
    opened.add(uri);
    return true;
  }

  @override
  Future<bool> redirect(Uri uri) async {
    redirected.add(uri);
    return true;
  }
}

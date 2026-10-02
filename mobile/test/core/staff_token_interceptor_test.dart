import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/networking/networking.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

/// A fake API: /internal/planning wants the token "new"; /internal/auth/refresh rotates "r1".
class FakeApi implements HttpClientAdapter {
  FakeApi({this.refreshWorks = true});
  final bool refreshWorks;
  final calls = <String>[];

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    final auth = options.headers['Authorization'];
    calls.add('${options.path} $auth');
    ResponseBody json(int status, Object body) =>
        ResponseBody.fromString(jsonEncode(body), status, headers: {Headers.contentTypeHeader: [Headers.jsonContentType]});
    if (options.path == 'internal/auth/refresh') {
      if (!refreshWorks) return json(401, {'message': 'expired', 'code': 'unauthorized'});
      return json(200, {
        'tokenData': {'access': {'token': 'new'}, 'refresh': {'token': 'r2'}},
      });
    }
    if (options.path == 'public/bookings/R1') return json(200, {'ok': true});
    return auth == 'Bearer new' ? json(200, {'ok': true}) : json(401, {'message': 'expired', 'code': 'unauthorized'});
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  late InMemorySecureStorageService storage;
  late SessionEvents session;

  Dio client(FakeApi api) {
    final options = BaseOptions(baseUrl: 'http://api.test/api/');
    final refreshDio = Dio(options)..httpClientAdapter = api;
    return Dio(options)
      ..httpClientAdapter = api
      ..interceptors.add(StaffTokenInterceptor(storage: storage, refreshDio: refreshDio, session: session));
  }

  setUp(() async {
    storage = InMemorySecureStorageService();
    session = SessionEvents();
    await storage.saveStaffTokens(const StaffTokens(access: 'old', refresh: 'r1'));
  });

  test('sur un 401, renouvelle la paire une fois puis rejoue la requête', () async {
    final api = FakeApi();
    final res = await client(api).get<dynamic>('internal/planning');
    expect(res.statusCode, 200);
    expect(api.calls, ['internal/planning Bearer old', 'internal/auth/refresh null', 'internal/planning Bearer new']);
    expect((await storage.staffTokens())!.refresh, 'r2');
  });

  test('renouvellement refusé : session terminée, jetons effacés', () async {
    final expired = expectLater(session.expired, emits(null));
    final api = FakeApi(refreshWorks: false);
    await expectLater(client(api).get<dynamic>('internal/planning'), throwsA(isA<DioException>()));
    await expired;
    expect(await storage.staffTokens(), isNull);
  });

  test('les routes voyageur ne reçoivent jamais le jeton du personnel', () async {
    final api = FakeApi();
    await client(api).get<dynamic>('public/bookings/R1');
    expect(api.calls, ['public/bookings/R1 null']);
  });
}

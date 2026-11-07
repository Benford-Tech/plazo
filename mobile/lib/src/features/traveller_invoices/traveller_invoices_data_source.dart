import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../core/error/exceptions.dart';
import '../../services/secure_storage_service.dart';

/// One invoice or credit note of the traveller's booking (07/11/2026, « Le client peut retrouver ses factures dans
/// Plazo », A + C), as the parking issued it.
class TravellerInvoiceModel {
  const TravellerInvoiceModel({
    required this.id,
    required this.kind,
    required this.number,
    required this.issuedAt,
    required this.totalTtcCents,
    required this.issuer,
    this.creditOf,
    this.creditedBy,
  });

  final String id;

  /// invoice | credit_note
  final String kind;
  final String number;
  final DateTime issuedAt;
  final int totalTtcCents;

  /// The parking's name, as on the invoice.
  final String issuer;
  final String? creditOf;
  final String? creditedBy;

  bool get isCreditNote => kind == 'credit_note';
  String get fileName => '${isCreditNote ? 'Avoir' : 'Facture'}-$number.pdf';

  factory TravellerInvoiceModel.fromJson(Map<String, dynamic> json) => TravellerInvoiceModel(
    id: json['id'] as String,
    kind: json['kind'] as String? ?? 'invoice',
    number: json['number'] as String,
    issuedAt: DateTime.parse(json['issuedAt'] as String),
    totalTtcCents: (json['totalTtcCents'] as num).toInt(),
    issuer: json['issuer'] as String? ?? '',
    creditOf: json['creditOf'] as String?,
    creditedBy: json['creditedBy'] as String?,
  );
}

/// The traveller's request, while the parking has not answered it.
class InvoiceRequestModel {
  const InvoiceRequestModel({required this.at, this.company, this.address});

  final DateTime at;
  final String? company;
  final String? address;

  static InvoiceRequestModel? fromJson(Object? json) {
    if (json is! Map<String, dynamic>) return null;
    return InvoiceRequestModel(at: DateTime.parse(json['at'] as String), company: json['company'] as String?, address: json['address'] as String?);
  }
}

/// refusal: reservation_cancelled · no_price · invoice_exists · already_requested · anonymized
class TravellerInvoicesModel {
  const TravellerInvoicesModel({this.invoices = const [], this.request, this.canRequest = false, this.refusal});

  final List<TravellerInvoiceModel> invoices;
  final InvoiceRequestModel? request;
  final bool canRequest;
  final String? refusal;

  /// Nothing to show and nothing to ask: the block stays hidden.
  bool get empty => invoices.isEmpty && request == null && !canRequest && refusal != 'no_price';

  factory TravellerInvoicesModel.fromJson(Map<String, dynamic> json) => TravellerInvoicesModel(
    invoices: [for (final i in (json['invoices'] as List<dynamic>? ?? const [])) TravellerInvoiceModel.fromJson(i as Map<String, dynamic>)],
    request: InvoiceRequestModel.fromJson(json['request']),
    canRequest: json['canRequest'] as bool? ?? false,
    refusal: json['refusal'] as String?,
  );
}

abstract class TravellerInvoicesDataSource {
  Future<TravellerInvoicesModel> fetch(String reference);
  Future<TravellerInvoicesModel> request(String reference, {String? company, String? address});
  Future<Uint8List> pdf(String reference, String invoiceId);
}

/// /public/bookings/:ref/invoices… with the booking's token (x-booking-token), kept on the phone.
class TravellerInvoicesDataSourceImpl implements TravellerInvoicesDataSource {
  TravellerInvoicesDataSourceImpl(this._dio, this._storage);
  final Dio _dio;
  final SecureStorageService _storage;

  Future<Options> _auth(String reference, {ResponseType? responseType}) async {
    final token = await _storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return Options(headers: {'x-booking-token': token}, responseType: responseType);
  }

  @override
  Future<TravellerInvoicesModel> fetch(String reference) async {
    final res = await _dio.get<Map<String, dynamic>>('public/bookings/$reference/invoices', options: await _auth(reference));
    return TravellerInvoicesModel.fromJson(res.data ?? const {});
  }

  @override
  Future<TravellerInvoicesModel> request(String reference, {String? company, String? address}) async {
    final res = await _dio.post<Map<String, dynamic>>(
      'public/bookings/$reference/invoices/request',
      data: {
        if (company != null && company.trim().isNotEmpty) 'company': company.trim(),
        if (address != null && address.trim().isNotEmpty) 'address': address.trim(),
      },
      options: await _auth(reference),
    );
    return TravellerInvoicesModel.fromJson(res.data ?? const {});
  }

  @override
  Future<Uint8List> pdf(String reference, String invoiceId) async {
    final res = await _dio.get<List<int>>(
      'public/bookings/$reference/invoices/$invoiceId/pdf',
      options: await _auth(reference, responseType: ResponseType.bytes),
    );
    return Uint8List.fromList(res.data ?? const []);
  }
}

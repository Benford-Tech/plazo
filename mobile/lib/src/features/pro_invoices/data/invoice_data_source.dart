import 'dart:typed_data';

import 'package:dio/dio.dart';

/// One invoice or credit note of a booking (06/11/2026, « une facture au nom du parking avec son logo », direction A).
class InvoiceModel {
  const InvoiceModel({
    required this.id,
    required this.kind,
    required this.number,
    required this.issuedAt,
    required this.totalTtcCents,
    this.customerEmail,
    this.sentAt,
    this.sentTo,
    this.creditOf,
    this.creditedBy,
  });

  final String id;

  /// invoice | credit_note
  final String kind;
  final String number;
  final DateTime issuedAt;
  final int totalTtcCents;
  final String? customerEmail;
  final DateTime? sentAt;
  final String? sentTo;
  final String? creditOf;
  final String? creditedBy;

  bool get isCreditNote => kind == 'credit_note';

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] as Map<String, dynamic>? ?? const {};
    final sentAt = json['sentAt'] as String?;
    return InvoiceModel(
      id: json['id'] as String,
      kind: json['kind'] as String? ?? 'invoice',
      number: json['number'] as String,
      issuedAt: DateTime.parse(json['issuedAt'] as String),
      totalTtcCents: (json['totalTtcCents'] as num).toInt(),
      customerEmail: customer['email'] as String?,
      sentAt: sentAt == null ? null : DateTime.parse(sentAt),
      sentTo: json['sentTo'] as String?,
      creditOf: json['creditOf'] as String?,
      creditedBy: json['creditedBy'] as String?,
    );
  }
}

/// A booking's invoices and whether one can be issued (refusal: billing_incomplete · no_price · reservation_cancelled ·
/// invoice_exists · anonymized).
class ReservationInvoicesModel {
  const ReservationInvoicesModel({required this.canCreate, this.refusal, this.customerEmail, this.invoices = const []});

  final bool canCreate;
  final String? refusal;
  final String? customerEmail;
  final List<InvoiceModel> invoices;

  factory ReservationInvoicesModel.fromJson(Map<String, dynamic> json) => ReservationInvoicesModel(
    canCreate: json['canCreate'] as bool? ?? false,
    refusal: json['refusal'] as String?,
    customerEmail: json['customerEmail'] as String?,
    invoices: [for (final i in (json['invoices'] as List<dynamic>? ?? const [])) InvoiceModel.fromJson(i as Map<String, dynamic>)],
  );
}

abstract class InvoiceDataSource {
  Future<ReservationInvoicesModel> fetch(String reservationId);
  Future<ReservationInvoicesModel> create(String reservationId, {String? customerCompany});
  Future<String> send(String invoiceId, {String? email});
  Future<ReservationInvoicesModel> creditNote(String invoiceId);
  Future<Uint8List> pdf(String invoiceId);
}

/// /internal/reservations/:id/invoices and /internal/invoices/:id/… (staff who manage bookings).
class InvoiceDataSourceImpl implements InvoiceDataSource {
  InvoiceDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<ReservationInvoicesModel> fetch(String reservationId) async {
    final res = await _dio.get<Map<String, dynamic>>('internal/reservations/$reservationId/invoices');
    return ReservationInvoicesModel.fromJson(res.data ?? const {});
  }

  @override
  Future<ReservationInvoicesModel> create(String reservationId, {String? customerCompany}) async {
    final res = await _dio.post<Map<String, dynamic>>(
      'internal/reservations/$reservationId/invoices',
      data: {if (customerCompany != null && customerCompany.trim().isNotEmpty) 'customerCompany': customerCompany.trim()},
    );
    return ReservationInvoicesModel.fromJson(res.data ?? const {});
  }

  @override
  Future<String> send(String invoiceId, {String? email}) async {
    final res = await _dio.post<Map<String, dynamic>>('internal/invoices/$invoiceId/send', data: {'email': ?email});
    return res.data?['sentTo'] as String? ?? email ?? '';
  }

  @override
  Future<ReservationInvoicesModel> creditNote(String invoiceId) async {
    final res = await _dio.post<Map<String, dynamic>>('internal/invoices/$invoiceId/credit-note', data: const <String, dynamic>{});
    return ReservationInvoicesModel.fromJson(res.data ?? const {});
  }

  @override
  Future<Uint8List> pdf(String invoiceId) async {
    final res = await _dio.get<List<int>>('internal/invoices/$invoiceId/pdf', options: Options(responseType: ResponseType.bytes));
    return Uint8List.fromList(res.data ?? const []);
  }
}

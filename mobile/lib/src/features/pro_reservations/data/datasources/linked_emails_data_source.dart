import 'package:dio/dio.dart';

/// One mail of a booking (« Mails liés », 27/10/2026, direction C): what Plazo kept of it and what it was to the booking.
class LinkedEmailModel {
  const LinkedEmailModel({
    required this.id,
    required this.role,
    required this.status,
    required this.receivedAt,
    this.subject,
    this.fromName,
    this.fromAddress,
    this.provider,
    this.textBody,
    this.summary,
    this.changes = const [],
  });

  final String id;

  /// created · change · cancellation · duplicate · linked.
  final String role;
  final String status;
  final DateTime receivedAt;
  final String? subject;
  final String? fromName;
  final String? fromAddress;
  final String? provider;

  /// Null once cleared, 30 days after the reception.
  final String? textBody;

  /// What Plazo or Claude made of it, in one sentence.
  final String? summary;

  /// A change or cancellation: one line per field (« from → to »), as the server stored them.
  final List<({String field, String? from, String? to})> changes;

  static String? _value(Object? v) => v == null ? null : '$v';

  factory LinkedEmailModel.fromJson(Map<String, dynamic> json) {
    final reading = json['reading'] as Map<String, dynamic>?;
    final change = json['change'] as Map<String, dynamic>?;
    return LinkedEmailModel(
      id: json['id'] as String,
      role: json['role'] as String? ?? 'linked',
      status: json['status'] as String? ?? '',
      receivedAt: DateTime.parse(json['receivedAt'] as String),
      subject: json['subject'] as String?,
      fromName: json['fromName'] as String?,
      fromAddress: json['fromAddress'] as String?,
      provider: json['provider'] as String?,
      textBody: json['textBody'] as String?,
      summary: reading?['summary'] as String?,
      changes: [
        for (final c in (change?['changes'] as List<dynamic>? ?? const []))
          if (c is Map<String, dynamic>) (field: c['field'] as String? ?? '', from: _value(c['from']), to: _value(c['to'])),
      ],
    );
  }
}

abstract class LinkedEmailsDataSource {
  Future<List<LinkedEmailModel>> fetch(String reservationId);
}

/// GET /internal/reservations/:id/emails (staff who reach the inbox).
class LinkedEmailsDataSourceImpl implements LinkedEmailsDataSource {
  LinkedEmailsDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<List<LinkedEmailModel>> fetch(String reservationId) async {
    final res = await _dio.get<Map<String, dynamic>>('internal/reservations/$reservationId/emails');
    return [for (final e in (res.data?['data'] as List<dynamic>? ?? const [])) LinkedEmailModel.fromJson(e as Map<String, dynamic>)];
  }
}

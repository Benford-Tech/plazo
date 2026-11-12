import 'dart:typed_data';

import 'package:dio/dio.dart';

/// « Messages WhatsApp » in Plazo Pro (12/11/2026, direction A of the web): what travellers write to Plazo's WhatsApp
/// number, the same routes as the web's (`/internal/whatsapp/inbox…`).
class WaReservation {
  const WaReservation({required this.id, required this.reference, required this.externalReference, required this.arrivalAt, required this.returnAt});

  factory WaReservation.fromJson(Map<String, dynamic> json) => WaReservation(
    id: json['id'] as String,
    reference: json['reference'] as String? ?? '',
    externalReference: json['externalReference'] as String?,
    arrivalAt: _date(json['arrivalAt']),
    returnAt: _date(json['returnAt']),
  );

  final String id;
  final String reference;
  final String? externalReference;
  final DateTime? arrivalAt;
  final DateTime? returnAt;
}

class WaConversation {
  const WaConversation({
    required this.id,
    required this.phone,
    required this.name,
    required this.reservation,
    required this.lastMessageAt,
    required this.unread,
    required this.handledAt,
    required this.previewText,
    required this.previewOut,
    required this.replyUntil,
    required this.unknown,
  });

  factory WaConversation.fromJson(Map<String, dynamic> json) {
    final preview = json['preview'] is Map ? Map<String, dynamic>.from(json['preview'] as Map) : null;
    final res = json['reservation'];
    return WaConversation(
      id: json['id'] as String,
      phone: json['phone'] as String? ?? '',
      name: json['name'] as String?,
      reservation: res is Map ? WaReservation.fromJson(Map<String, dynamic>.from(res)) : null,
      lastMessageAt: _date(json['lastMessageAt']) ?? DateTime.now(),
      unread: json['unread'] as int? ?? 0,
      handledAt: _date(json['handledAt']),
      previewText: preview?['text'] as String? ?? '',
      previewOut: preview?['direction'] == 'out',
      replyUntil: _date(json['replyUntil']),
      unknown: json['unknown'] == true,
    );
  }

  final String id;

  /// As the parking writes it, « 06 12 34 56 78 ».
  final String phone;
  final String? name;
  final WaReservation? reservation;
  final DateTime lastMessageAt;
  final int unread;
  final DateTime? handledAt;
  final String previewText;
  final bool previewOut;

  /// Until when a free reply can be sent (Meta's 24 hours); null: only a call.
  final DateTime? replyUntil;
  final bool unknown;

  WaConversation read() => WaConversation(
    id: id,
    phone: phone,
    name: name,
    reservation: reservation,
    lastMessageAt: lastMessageAt,
    unread: 0,
    handledAt: handledAt,
    previewText: previewText,
    previewOut: previewOut,
    replyUntil: replyUntil,
    unknown: unknown,
  );
}

class WaInbox {
  const WaInbox({required this.items, required this.counts});
  final List<WaConversation> items;

  /// unread · all · handled (unknown: platform only).
  final Map<String, int> counts;
}

class WaMessage {
  const WaMessage({
    required this.id,
    required this.out,
    required this.type,
    required this.text,
    required this.hasMedia,
    required this.status,
    required this.at,
    required this.by,
  });

  factory WaMessage.fromJson(Map<String, dynamic> json) => WaMessage(
    id: json['id'] as String,
    out: json['direction'] == 'out',
    type: json['type'] as String? ?? 'text',
    text: json['text'] as String?,
    hasMedia: json['hasMedia'] == true,
    status: json['status'] as String?,
    at: _date(json['at']) ?? DateTime.now(),
    by: json['by'] is Map ? (json['by'] as Map)['firstName'] as String? : null,
  );

  final String id;
  final bool out;
  final String type;
  final String? text;
  final bool hasMedia;
  final String? status;
  final DateTime at;

  /// The first name of the member who replied.
  final String? by;
}

/// What Plazo itself sent the booking by WhatsApp (confirmation, day before…), shown between the messages.
class WaSent {
  const WaSent({required this.id, required this.kind, required this.status, required this.at, this.text});
  factory WaSent.fromJson(Map<String, dynamic> json) => WaSent(
    id: json['id'] as String,
    kind: json['kind'] as String? ?? '',
    status: json['status'] as String? ?? '',
    at: _date(json['at']) ?? DateTime.now(),
    text: json['text'] as String?,
  );
  final String id;
  final String kind;
  final String status;
  final DateTime at;

  /// The text the traveller read (kept since 12/11/2026; null before).
  final String? text;
}

/// « Envoyés » (12/11/2026, « Affiche aussi les messages envoyés »): one WhatsApp Plazo sent a traveller (30 days).
class WaSentMessage {
  const WaSentMessage({
    required this.sent,
    required this.phone,
    required this.smsFallback,
    required this.customerName,
    required this.reference,
    required this.reservationId,
    required this.conversationId,
  });

  factory WaSentMessage.fromJson(Map<String, dynamic> json) {
    final res = json['reservation'] is Map ? Map<String, dynamic>.from(json['reservation'] as Map) : null;
    return WaSentMessage(
      sent: WaSent.fromJson(json),
      phone: json['phone'] as String? ?? '',
      smsFallback: json['smsFallback'] == true,
      customerName: res?['customerName'] as String?,
      reference: res == null ? null : (res['externalReference'] as String? ?? res['reference'] as String?),
      reservationId: res?['id'] as String?,
      conversationId: json['conversationId'] as String?,
    );
  }

  final WaSent sent;
  final String phone;
  final bool smsFallback;
  final String? customerName;
  final String? reference;
  final String? reservationId;
  final String? conversationId;
}

class WaThread {
  const WaThread({required this.conversation, required this.messages, required this.sent});
  factory WaThread.fromJson(Map<String, dynamic> json) => WaThread(
    conversation: WaConversation.fromJson(Map<String, dynamic>.from(json['conversation'] as Map)),
    messages: [for (final m in (json['messages'] as List? ?? const [])) WaMessage.fromJson(Map<String, dynamic>.from(m as Map))],
    sent: [for (final s in (json['sent'] as List? ?? const [])) WaSent.fromJson(Map<String, dynamic>.from(s as Map))],
  );
  final WaConversation conversation;
  final List<WaMessage> messages;
  final List<WaSent> sent;
}

DateTime? _date(Object? value) => value is String ? DateTime.tryParse(value)?.toLocal() : null;

abstract class WhatsappInboxDataSource {
  Future<WaInbox> list(String view);
  Future<WaThread> get(String id);
  Future<WaMessage> reply(String id, String text);
  Future<WaConversation> setHandled(String id, bool handled);
  Future<Uint8List> media(String messageId);
  Future<List<WaSentMessage>> sent();

  /// Unread messages, for the badge of Plus (`/internal/nav/counts`).
  Future<int> unreadCount();
}

class WhatsappInboxDataSourceImpl implements WhatsappInboxDataSource {
  WhatsappInboxDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<WaInbox> list(String view) async {
    final res = await _dio.get<Map<String, dynamic>>('internal/whatsapp/inbox', queryParameters: {'view': view});
    final data = res.data ?? const {};
    return WaInbox(
      items: [for (final row in (data['data'] as List? ?? const [])) WaConversation.fromJson(Map<String, dynamic>.from(row as Map))],
      counts: {
        for (final e in ((data['counts'] as Map?) ?? const {}).entries)
          if (e.value is int) e.key as String: e.value as int,
      },
    );
  }

  @override
  Future<WaThread> get(String id) async {
    final res = await _dio.get<Map<String, dynamic>>('internal/whatsapp/inbox/$id');
    return WaThread.fromJson(res.data ?? const {});
  }

  @override
  Future<WaMessage> reply(String id, String text) async {
    final res = await _dio.post<Map<String, dynamic>>('internal/whatsapp/inbox/$id/reply', data: {'text': text});
    return WaMessage.fromJson(res.data ?? const {});
  }

  @override
  Future<WaConversation> setHandled(String id, bool handled) async {
    final res = await _dio.post<Map<String, dynamic>>('internal/whatsapp/inbox/$id/${handled ? 'handle' : 'unhandle'}', data: const <String, dynamic>{});
    return WaConversation.fromJson(res.data ?? const {});
  }

  @override
  Future<Uint8List> media(String messageId) async {
    final res = await _dio.get<List<int>>('internal/whatsapp/inbox/messages/$messageId/media', options: Options(responseType: ResponseType.bytes));
    return Uint8List.fromList(res.data ?? const []);
  }

  @override
  Future<List<WaSentMessage>> sent() async {
    final res = await _dio.get<Map<String, dynamic>>('internal/whatsapp/sent');
    return [for (final row in (res.data?['data'] as List? ?? const [])) WaSentMessage.fromJson(Map<String, dynamic>.from(row as Map))];
  }

  @override
  Future<int> unreadCount() async {
    final res = await _dio.get<Map<String, dynamic>>('internal/nav/counts');
    return res.data?['whatsapp'] as int? ?? 0;
  }
}

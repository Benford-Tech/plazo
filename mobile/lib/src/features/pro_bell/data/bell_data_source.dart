import 'dart:async';

import 'package:dio/dio.dart';

/// 02/11/2026 (« Mes notifications »): the bell of Plazo Pro, the same routes as the web's (`/internal/notifications…`).
class BellNotification {
  const BellNotification({
    required this.id,
    required this.event,
    required this.title,
    required this.body,
    required this.target,
    required this.createdAt,
    required this.readAt,
  });

  factory BellNotification.fromJson(Map<String, dynamic> json) => BellNotification(
    id: json['id'] as String,
    event: json['event'] as String,
    title: json['title'] as String? ?? '',
    body: json['body'] as String? ?? '',
    target: json['target'] as String?,
    createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ?? DateTime.now(),
    readAt: DateTime.tryParse(json['readAt'] as String? ?? '')?.toLocal(),
  );

  final String id;
  final String event;
  final String title;
  final String body;

  /// Path in the pro space (« /reservations/… »), null: nowhere.
  final String? target;
  final DateTime createdAt;
  final DateTime? readAt;

  bool get unread => readAt == null;

  BellNotification read() =>
      BellNotification(id: id, event: event, title: title, body: body, target: target, createdAt: createdAt, readAt: readAt ?? DateTime.now());
}

class BellPage {
  const BellPage({required this.items, required this.hasMore, required this.unread});
  final List<BellNotification> items;
  final bool hasMore;
  final int unread;
}

/// Per event, whether it reaches the phone, the browser and the bell.
class ChannelSet {
  const ChannelSet({required this.phone, required this.browser, required this.bell});
  factory ChannelSet.fromJson(Map<String, dynamic> json) =>
      ChannelSet(phone: json['phone'] == true, browser: json['browser'] == true, bell: json['bell'] == true);
  final bool phone;
  final bool browser;
  final bool bell;
}

class NotificationChannels {
  const NotificationChannels({required this.role, required this.channels});
  factory NotificationChannels.fromJson(Map<String, dynamic> json) => NotificationChannels(
    role: json['role'] as String? ?? '',
    channels: {
      for (final e in ((json['channels'] as Map?) ?? const {}).entries) e.key as String: ChannelSet.fromJson(Map<String, dynamic>.from(e.value as Map)),
    },
  );
  final String role;
  final Map<String, ChannelSet> channels;
}

class NotificationTest {
  const NotificationTest({required this.phones, required this.phonesConfigured});
  final int phones;
  final bool phonesConfigured;
}

abstract class BellDataSource {
  Future<BellPage> list({String filter = 'all', DateTime? before});
  Future<int> count();
  Future<int> markRead([List<String>? ids]);
  Future<NotificationChannels> channels();
  Future<NotificationChannels> setChannel(String event, String channel, bool value);
  Future<NotificationTest> test();

  /// The unread count after every change made here (a notification read on the page lowers the bell's badge).
  Stream<int> get unreadChanges;
}

class BellDataSourceImpl implements BellDataSource {
  BellDataSourceImpl(this._dio);
  final Dio _dio;
  final _unread = StreamController<int>.broadcast();

  @override
  Stream<int> get unreadChanges => _unread.stream;

  @override
  Future<BellPage> list({String filter = 'all', DateTime? before}) async {
    final res = await _dio.get<Map<String, dynamic>>(
      'internal/notifications',
      queryParameters: {if (filter != 'all') 'filter': filter, if (before != null) 'before': before.toUtc().toIso8601String()},
    );
    final data = res.data ?? const {};
    final unread = data['unread'] as int? ?? 0;
    _unread.add(unread);
    return BellPage(
      items: [for (final row in (data['data'] as List? ?? const [])) BellNotification.fromJson(Map<String, dynamic>.from(row as Map))],
      hasMore: data['hasMore'] == true,
      unread: unread,
    );
  }

  @override
  Future<int> count() async {
    final res = await _dio.get<Map<String, dynamic>>('internal/notifications/count');
    return res.data?['unread'] as int? ?? 0;
  }

  @override
  Future<int> markRead([List<String>? ids]) async {
    final res = await _dio.post<Map<String, dynamic>>('internal/notifications/read', data: {'ids': ?ids});
    final unread = res.data?['unread'] as int? ?? 0;
    _unread.add(unread);
    return unread;
  }

  @override
  Future<NotificationChannels> channels() async {
    final res = await _dio.get<Map<String, dynamic>>('internal/notifications/channels');
    return NotificationChannels.fromJson(res.data ?? const {});
  }

  @override
  Future<NotificationChannels> setChannel(String event, String channel, bool value) async {
    final res = await _dio.put<Map<String, dynamic>>(
      'internal/notifications/channels',
      data: {
        'channels': {
          event: {channel: value},
        },
      },
    );
    return NotificationChannels.fromJson(res.data ?? const {});
  }

  @override
  Future<NotificationTest> test() async {
    final res = await _dio.post<Map<String, dynamic>>('internal/notifications/test');
    return NotificationTest(phones: res.data?['phones'] as int? ?? 0, phonesConfigured: res.data?['phonesConfigured'] == true);
  }
}

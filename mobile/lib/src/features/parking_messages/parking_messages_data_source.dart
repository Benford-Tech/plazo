import 'package:dio/dio.dart';

import '../../core/error/exceptions.dart';
import '../../services/secure_storage_service.dart';

/// « Écrire au parking » (12/11/2026): one message of the booking's thread, the traveller's (`me`) or the parking team's.
class ParkingMessage {
  const ParkingMessage({required this.id, required this.mine, required this.text, required this.at, required this.by});

  factory ParkingMessage.fromJson(Map<String, dynamic> json) => ParkingMessage(
    id: json['id'] as String,
    mine: json['from'] == 'me',
    text: json['text'] as String? ?? '',
    at: DateTime.tryParse(json['at'] as String? ?? '')?.toLocal() ?? DateTime.now(),
    by: json['by'] as String?,
  );

  final String id;
  final bool mine;
  final String text;
  final DateTime at;

  /// The first name of the team member who answered.
  final String? by;
}

class ParkingThread {
  const ParkingThread({required this.messages, required this.canWrite});
  final List<ParkingMessage> messages;
  final bool canWrite;
}

abstract class ParkingMessagesDataSource {
  Future<ParkingThread> fetch(String reference);
  Future<ParkingMessage> write(String reference, String text);
}

/// /public/bookings/:ref/messages with the booking's token (x-booking-token), kept on the phone. The message lands in
/// the parking's « Messages WhatsApp » (web and Plazo Pro); the reply comes back here, with a push.
class ParkingMessagesDataSourceImpl implements ParkingMessagesDataSource {
  ParkingMessagesDataSourceImpl(this._dio, this._storage);
  final Dio _dio;
  final SecureStorageService _storage;

  Future<Options> _auth(String reference) async {
    final token = await _storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return Options(headers: {'x-booking-token': token});
  }

  @override
  Future<ParkingThread> fetch(String reference) async {
    final res = await _dio.get<Map<String, dynamic>>('public/bookings/$reference/messages', options: await _auth(reference));
    final data = res.data ?? const {};
    return ParkingThread(
      messages: [for (final m in (data['messages'] as List? ?? const [])) ParkingMessage.fromJson(Map<String, dynamic>.from(m as Map))],
      canWrite: data['canWrite'] != false,
    );
  }

  @override
  Future<ParkingMessage> write(String reference, String text) async {
    final res = await _dio.post<Map<String, dynamic>>('public/bookings/$reference/messages', data: {'text': text}, options: await _auth(reference));
    return ParkingMessage.fromJson(res.data ?? const {});
  }
}

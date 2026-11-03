import 'package:dio/dio.dart';

/// 03/11/2026 (« Pouvoir supprimer une réservation… elle s'archive 45 jours »): managers delete a booking typed by
/// mistake, a duplicate or a test; it stays restorable 45 days (Réservations › Supprimées on the web).
abstract class ReservationTrashDataSource {
  /// DELETE /internal/reservations/:id { reason? }
  Future<void> delete(String reservationId, {String? reason});

  /// POST /internal/reservations/:id/restore → whether a night of the stay is now overbooked.
  Future<bool> restore(String reservationId);
}

class ReservationTrashDataSourceImpl implements ReservationTrashDataSource {
  ReservationTrashDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<void> delete(String reservationId, {String? reason}) async {
    await _dio.delete<Map<String, dynamic>>(
      'internal/reservations/$reservationId',
      data: {if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim()},
    );
  }

  @override
  Future<bool> restore(String reservationId) async {
    final res = await _dio.post<Map<String, dynamic>>('internal/reservations/$reservationId/restore');
    return res.data?['overbooked'] == true;
  }
}

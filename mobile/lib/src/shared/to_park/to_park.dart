/// 12/11/2026 (« Plus de « Sans place » une fois le client parti en navette »): the API's `toPark: { since }`, flattened
/// to its time for a model field (`@JsonKey(readValue: readToParkSince)`).
Object? readToParkSince(Map<dynamic, dynamic> json, String _) {
  final toPark = json['toPark'];
  return toPark is Map ? toPark['since'] : null;
}

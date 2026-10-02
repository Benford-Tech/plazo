class ServerException implements Exception {
  const ServerException({this.trace, this.message, this.code});

  final StackTrace? trace;
  final String? message;
  final String? code;
}

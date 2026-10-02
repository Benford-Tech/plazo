import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  const Failure(this.message, this.statusCode, this.code, this.fields, this.details);

  /// Already translated, ready to show.
  final String? message;
  final int? statusCode;

  /// The API's machine-readable code (e.g. `too_many_positions`), and per-field codes.
  final String? code;
  final Map<String, String>? fields;
  final Map<String, dynamic>? details;

  @override
  List<Object?> get props => [message, statusCode, code];
}

// General failures
class ServerFailure extends Failure {
  const ServerFailure({String? message, int? statusCode, String? code, Map<String, String>? fields, Map<String, dynamic>? details})
    : super(message, statusCode, code, fields, details);
}

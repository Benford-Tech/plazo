import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../error/exceptions.dart';
import '../error/failure.dart';
import '../utils/either.dart';
import '../utils/error_message_handler.dart';

extension RepositoryExtension<T> on Future<T> {
  /// Runs a request and turns any error into a [ServerFailure] with the API's code (no body is
  /// logged: it may hold a traveller's data or position).
  Future<Either<Failure, T>> makeRequest() async {
    try {
      final data = await this;
      return Right(data);
    } on DioException catch (e) {
      debugPrint('Request failed: ${e.requestOptions.method} ${e.requestOptions.path} → ${e.response?.statusCode} ${e.errorCode ?? ''}');
      return Left(
        ServerFailure(
          message: e.errorMessage,
          statusCode: e.response?.statusCode,
          code: e.errorCode,
          fields: e.errorFields,
          details: e.errorDetails,
        ),
      );
    } on ServerException catch (e) {
      return Left(ServerFailure(message: translateErrorCode(e.code), code: e.code));
    } catch (e) {
      debugPrint('Unexpected error: ${e.runtimeType}');
      return Left(ServerFailure(message: translateErrorCode(null)));
    }
  }
}

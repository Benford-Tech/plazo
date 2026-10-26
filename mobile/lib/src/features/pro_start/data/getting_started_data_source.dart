import 'package:dio/dio.dart';

/// One step of « Bien démarrer » (T-A, 26/10/2026): ticked by the server from what Plazo sees.
class GettingStartedStep {
  const GettingStartedStep({required this.key, required this.done, this.detail});

  final String key;
  final bool done;

  /// A short French line (counts, dates) under the title, or null for the step's own text.
  final String? detail;

  factory GettingStartedStep.fromJson(Map<String, dynamic> json) =>
      GettingStartedStep(key: json['key'] as String, done: json['done'] == true, detail: json['detail'] as String?);
}

/// GET /internal/getting-started: the steps of the member's post of the day, nothing stored.
class GettingStartedModel {
  const GettingStartedModel({required this.post, required this.steps, required this.done, required this.total});

  final String post;
  final List<GettingStartedStep> steps;
  final int done;
  final int total;

  bool get complete => total > 0 && done >= total;

  factory GettingStartedModel.fromJson(Map<String, dynamic> json) => GettingStartedModel(
    post: json['post'] as String? ?? 'agent',
    steps: [for (final s in (json['steps'] as List<dynamic>? ?? const [])) GettingStartedStep.fromJson(s as Map<String, dynamic>)],
    done: (json['done'] as num?)?.toInt() ?? 0,
    total: (json['total'] as num?)?.toInt() ?? 0,
  );
}

abstract class GettingStartedDataSource {
  Future<GettingStartedModel> fetch();
}

class GettingStartedDataSourceImpl implements GettingStartedDataSource {
  GettingStartedDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<GettingStartedModel> fetch() async {
    final res = await _dio.get<Map<String, dynamic>>('internal/getting-started');
    return GettingStartedModel.fromJson(res.data ?? const {});
  }
}

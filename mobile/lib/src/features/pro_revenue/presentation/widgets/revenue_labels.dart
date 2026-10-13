import 'package:easy_localization/easy_localization.dart';

import '../../../../core/constants/product.g.dart';
import '../../data/models/revenue_models.dart';

/// A channel's name: the comparator's own (« Allopark ») when the API gives it, else the channel's.
String revenueChannelName(String channel, String? detail) =>
    detail != null && detail.trim().isNotEmpty ? detail.trim() : 'res.channel.$channel'.tr(args: [Product.name]);

String revenueLineName(RevenueChannelModel line) => revenueChannelName(line.channel, line.detail);

/// « 6,4 » or « 6 » days, French decimals.
String revenueDays(double days) {
  final rounded = (days * 10).round() / 10;
  return rounded == rounded.roundToDouble() ? rounded.toStringAsFixed(0) : rounded.toStringAsFixed(1).replaceAll('.', ',');
}

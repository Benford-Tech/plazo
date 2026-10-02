import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/constants/app_constants.dart';

/// Everything that leaves the app: the site's pages, the maps app, a phone call, an email, and
/// Stripe's payment page on web builds. Behind an interface so that tests see what was opened.
abstract class LinkService {
  /// Opens [uri] outside the app (browser, maps, dialer). False when nothing could open it.
  Future<bool> open(Uri uri);

  /// Web builds: goes to [uri] in the same tab (Stripe Checkout).
  Future<bool> redirect(Uri uri);

  /// A page of the traveller site ("/conditions"…).
  Uri sitePage(String path) => Uri.parse('${AppConstants.siteUrl}$path');

  /// Directions to an address, in the phone's maps app (Google Maps' universal link: opens Google
  /// Maps or the browser; Apple Maps on iOS when Google Maps is absent is up to the system).
  Uri directions(String destination) =>
      Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${Uri.encodeQueryComponent(destination)}');
}

class UrlLauncherLinkService extends LinkService {
  @override
  Future<bool> open(Uri uri) async {
    try {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Could not open a link: ${e.runtimeType}');
      return false;
    }
  }

  @override
  Future<bool> redirect(Uri uri) async {
    try {
      return await launchUrl(uri, webOnlyWindowName: '_self');
    } catch (e) {
      debugPrint('Could not open a link: ${e.runtimeType}');
      return false;
    }
  }
}

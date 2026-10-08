/// Build-time settings, passed with --dart-define (never secrets: everything here ships in the app).
///
///   flutter run --dart-define=API_BASE_URL=http://localhost:3005/api
abstract final class AppConstants {
  /// Which of the two apps this build is (A-B, 04/10/2026): "traveller" (Plazo) or "pro" (Plazo Pro).
  /// Same code, two entry points: --dart-define=APP_FLAVOR=pro (and --flavor pro on Android).
  static const flavor = String.fromEnvironment('APP_FLAVOR', defaultValue: 'traveller');
  static const isPro = flavor == 'pro';

  /// The API, with its /api prefix. Production by default.
  static const baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://www.plazo.fr/api');

  /// The traveller site (its legal pages, FAQ): the API's address without /api, unless given.
  static const _siteUrl = String.fromEnvironment('SITE_URL');
  static String get siteUrl {
    if (_siteUrl.isNotEmpty) return _siteUrl.endsWith('/') ? _siteUrl.substring(0, _siteUrl.length - 1) : _siteUrl;
    final api = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    return api.endsWith('/api') ? api.substring(0, api.length - 4) : api;
  }

  /// Apple Pay merchant id (merchant.xxx, see README). Empty: no Apple Pay button in the sheet.
  static const appleMerchantId = String.fromEnvironment('STRIPE_MERCHANT_ID');

  /// Google Pay in Stripe's test environment (true until the live keys).
  static const googlePayTestEnv = bool.fromEnvironment('GOOGLE_PAY_TEST', defaultValue: true);

  /// The parkings' time zone: every date exchanged with the API is a wall-clock time there.
  static const parkingTimezone = 'Europe/Paris';

  /// Airport shown first (the site's default).
  static const defaultAirport = 'lyon-saint-exupery';

  /// OneSignal app id (public, not a secret). Empty: push notifications are off.
  static const oneSignalAppId = String.fromEnvironment('ONESIGNAL_APP_ID');

  /// Polling of the staff's live arrivals (Vercel has no websockets): 10 to 15 s.
  static const livePollInterval = Duration(seconds: 12);

  /// Map tiles: IGN Géoplateforme, "Plan IGN v2" (WMTS, no key).
  static const ignPlanTilesUrl =
      'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2'
      '&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
  static const ignAttribution = '© IGN – Plan IGN';

  /// Aerial photo (BD ORTHO, 20 cm) for the parking plan: same WMTS, no key.
  static const ignOrthoTilesUrl =
      'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS'
      '&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
  static const ignOrthoAttribution = '© IGN – BD ORTHO';
}

/// Build-time settings, passed with --dart-define (never secrets: everything here ships in the app).
///
///   flutter run --dart-define=API_BASE_URL=http://localhost:3005/api
abstract final class AppConstants {
  /// The API, with its /api prefix. Production by default.
  static const baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://plazo-benford-tech.vercel.app/api');

  /// OneSignal app id (public, not a secret). Empty: push notifications are off.
  static const oneSignalAppId = String.fromEnvironment('ONESIGNAL_APP_ID');

  /// Polling of the staff's live arrivals (Vercel has no websockets): 10 to 15 s.
  static const livePollInterval = Duration(seconds: 12);

  /// Map tiles: IGN Géoplateforme, "Plan IGN v2" (WMTS, no key).
  static const ignPlanTilesUrl =
      'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2'
      '&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
  static const ignAttribution = '© IGN – Plan IGN';
}

import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';

/// Direction D ("style Thempo"): easyJet-orange header (T-A, 03/10/2026), light-orange accent (V-A, 03/10/2026, in place of the
/// violet), peach for the highlight, a light-orange → peach gradient on primary actions, Playfair
/// Display titles + Inter, rounded cards.
/// Plazo Pro takes the colours of the pro web space, direction C-B "Opérations" (05/10/2026): light
/// grey ground `#EEF0EE`, white rounded cards, lime `#A3E635` for the action and what is active, dark
/// green `#1E5E2E` on the lime and for the strong text, JetBrains Mono for the figures.
/// The flavor is a compile-time constant, so every colour below stays a `const`.
const bool _pro = AppConstants.isPro;

abstract final class AppColors {
  /// The header: easyJet orange for travellers, black for the pro.
  static const brand = _pro ? Color(0xFFFFFFFF) : Color(0xFFFF6600);

  /// The dark neutral (strong text, dark surfaces) in place of the former purple; light text on the pro's black.
  static const dark = _pro ? Color(0xFF1E5E2E) : Color(0xFF2C1A0E);

  /// T-A (05/10/2026): the traveller's action is the easyJet orange itself, no lighter orange.
  static const accent = _pro ? Color(0xFFA3E635) : Color(0xFFFF6600);
  static const peach = _pro ? Color(0xFF16A34A) : Color(0xFFF0A36B);

  /// Pale tints: selected backgrounds and the light text on the header.
  static const tint = _pro ? Color(0xFFEEF7DD) : Color(0xFFFFF1E8);
  static const tintSoft = _pro ? Color(0xFFF4F9EA) : Color(0xFFFFF7F1);
  static const onBrandSoft = _pro ? Color(0xFF6B7280) : Color(0xFFFFE9D6);
  static const accentDeep = _pro ? Color(0xFF1E5E2E) : Color(0xFFC24E00);
  static const accentLight = _pro ? Color(0xFFC7F06B) : Color(0xFFFF8A3D);

  /// Titles on the traveller's light ground (dark brown), the ink on the pro.
  static const brownOrInk = _pro ? Color(0xFF1E5E2E) : Color(0xFF2C1A0E);
  static const ink = _pro ? Color(0xFF1A1D1A) : Color(0xFF1E1E1E);
  static const muted = _pro ? Color(0xFF6B7280) : Color(0xFF6F6A66);
  static const line = _pro ? Color(0xFFE4E6E2) : Color(0xFFE3E1DE);

  /// T-A: the traveller's pages sit on a light grey ground, cards white on it.
  static const background = _pro ? Color(0xFFEEF0EE) : Color(0xFFECECEE);
  static const canvas = _pro ? Color(0xFFF4F6F2) : Color(0xFFF5F5F7);

  /// Cards and sheets (white for travellers, a slightly lighter black for the pro).
  static const surface = Color(0xFFFFFFFF);

  /// Text on the primary action (white on the orange gradient, black on the yellow).
  static const onAccent = _pro ? Color(0xFF0F2A14) : Color(0xFFFFFFFF);
  static const danger = _pro ? Color(0xFFDC2626) : Color(0xFFB3261E);
  static const success = _pro ? Color(0xFF16A34A) : Color(0xFF2E7D4F);

  /// Dashboard panels (fusion "Flotte + Opérations", 05/10/2026): anthracite cards on the pro's black.
  static const panel = Color(0xFFFFFFFF);
  static const panel2 = _pro ? Color(0xFFF4F6F2) : Color(0xFFF4F4F1);
  static const panelLine = _pro ? Color(0xFFE4E6E2) : Color(0xFFE4E4DF);

  /// French plate: EU blue band.
  static const plateBlue = Color(0xFF1F3FA6);

  /// Solid on both apps since T-A (the traveller's buttons are plain orange, as the mockup).
  static const primaryGradient = LinearGradient(begin: Alignment(-1, -0.2), end: Alignment(1, 0.2), colors: [accent, accent]);
}

/// The four state colours of the dashboard mockups (same in both apps): filled badges use the
/// strong colour with a dark ink, status pills the soft background with the light text.
abstract final class AppStatus {
  static const ok = Color(0xFF16A34A);
  static const okInk = Color(0xFFFFFFFF);
  static const okSoft = Color(0xFFE8F7EC);
  static const okText = Color(0xFF16A34A);
  static const warn = Color(0xFFD97706);
  static const warnInk = Color(0xFFFFFFFF);
  static const warnSoft = Color(0xFFFFF4E0);
  static const warnText = Color(0xFFD97706);
  static const bad = Color(0xFFDC2626);
  static const badSoft = Color(0xFFFDECEC);
  static const badText = Color(0xFFDC2626);
  static const info = Color(0xFF4F46E5);
  static const infoInk = Color(0xFFFFFFFF);
  static const infoSoft = Color(0xFFE8EFFD);
}

/// Corners: 22 px for travellers (T-A), 14 px for the pro (C-B).
abstract final class AppRadius {
  static const card = BorderRadius.all(Radius.circular(_pro ? 14 : 22));
  static const field = BorderRadius.all(Radius.circular(_pro ? 12 : 16));
  static const chip = BorderRadius.all(Radius.circular(_pro ? 10 : 14));
  static const pill = BorderRadius.all(Radius.circular(26));
  static const small = BorderRadius.all(Radius.circular(8));
}

/// Fonts: Playfair Display + Inter for travellers; Archivo Narrow + JetBrains Mono for the pro.
abstract final class AppFonts {
  static const title = _pro ? 'ArchivoNarrow' : 'PlayfairDisplay';

  /// F-A (05/10/2026): Manrope for the traveller's text and figures; Inter stays on the pro.
  static const body = _pro ? 'Inter' : 'Manrope';
  static const mono = _pro ? 'JetBrainsMono' : 'Manrope';
}

/// Bundled variable fonts: the weight goes through the 'wght' axis too.
TextStyle _font(String family, double size, int weight, {bool italic = false, Color? color, double? height}) => TextStyle(
  fontFamily: family,
  fontSize: size,
  fontWeight: FontWeight.values[(weight ~/ 100) - 1],
  fontVariations: [FontVariation('wght', weight.toDouble())],
  fontStyle: italic ? FontStyle.italic : FontStyle.normal,
  color: color,
  height: height,
);

abstract final class AppText {
  static TextStyle title({double size = 24, Color color = AppColors.ink}) =>
      _pro ? _font(AppFonts.title, size, 700, color: color).copyWith(letterSpacing: 0.3) : _font(AppFonts.title, size, 500, italic: true, color: color);
  static TextStyle body({double size = 15, int weight = 400, Color color = AppColors.ink, double? height}) =>
      _font(AppFonts.body, size, weight, color: color, height: height);
  static TextStyle muted({double size = 13.5}) => _font(AppFonts.body, size, 400, color: AppColors.muted, height: 1.45);
  static TextStyle strong({double size = 15, Color color = AppColors.ink}) => _font(AppFonts.body, size, 700, color: color);
  static TextStyle big({double size = 34, Color color = AppColors.ink}) => _font(AppFonts.body, size, 800, color: color, height: 1.1);
  static TextStyle label({double size = 12.5, Color color = AppColors.muted}) => _font(AppFonts.body, size, 600, color: color).copyWith(letterSpacing: 0.8);
  static TextStyle tabular({double size = 15, int weight = 700, Color color = AppColors.ink}) =>
      _font(AppFonts.mono, size, weight, color: color).copyWith(fontFeatures: const [FontFeature.tabularFigures()]);
}

ThemeData appTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.accent,
    primary: AppColors.accent,
    secondary: AppColors.peach,
    surface: AppColors.background,
    error: AppColors.danger,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme.copyWith(onSurface: AppColors.ink, onPrimary: AppColors.onAccent),
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.background,
    canvasColor: AppColors.surface,
    cardColor: AppColors.surface,
    dialogTheme: const DialogThemeData(backgroundColor: AppColors.surface),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    ),
    dividerColor: AppColors.line,
    fontFamily: AppFonts.body,
    textTheme: ThemeData.light().textTheme.apply(fontFamily: AppFonts.body, bodyColor: AppColors.ink, displayColor: AppColors.ink),
    appBarTheme: AppBarTheme(
      // Both apps: the bar sits on the ground (grey for travellers, white for the pro), no coloured band.
      backgroundColor: _pro ? AppColors.brand : AppColors.background,
      foregroundColor: AppColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: AppText.title(size: 24, color: AppColors.brownOrInk),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: AppRadius.field,
        borderSide: BorderSide(color: AppColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: AppRadius.field,
        borderSide: BorderSide(color: AppColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppRadius.field,
        borderSide: BorderSide(color: AppColors.accent, width: 1.6),
      ),
      labelStyle: TextStyle(color: AppColors.muted),
      hintStyle: TextStyle(color: AppColors.muted),
      helperStyle: TextStyle(color: AppColors.muted),
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    listTileTheme: const ListTileThemeData(textColor: AppColors.ink, iconColor: AppColors.muted),
    iconTheme: const IconThemeData(color: AppColors.ink),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.accent),
    tabBarTheme: TabBarThemeData(
      labelColor: AppColors.dark,
      unselectedLabelColor: AppColors.muted,
      indicatorColor: AppColors.accent,
      labelStyle: AppText.label(size: 13.5, color: AppColors.dark),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : null),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.accent : null),
    ),
    snackBarTheme: const SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: _pro ? AppColors.accent : AppColors.dark,
      contentTextStyle: TextStyle(color: AppColors.onAccent, fontFamily: 'Inter'),
      shape: RoundedRectangleBorder(borderRadius: AppRadius.small),
    ),
  );
}

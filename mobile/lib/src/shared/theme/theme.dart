import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';

/// Direction D ("style Thempo"): easyJet-orange header (T-A, 03/10/2026), light-orange accent (V-A, 03/10/2026, in place of the
/// violet), peach for the highlight, a light-orange → peach gradient on primary actions, Playfair
/// Display titles + Inter, rounded cards.
/// Plazo Pro (decision of 04/10/2026) takes the colours of the pro web space, direction B
/// "Tableau des vols": black `#0B0B0C`, yellow `#F5C400` for the action and the hours, text
/// `#F3F3F0`, grey `#A8A8A2`, rules `#3A3A38`, sharp corners, JetBrains Mono for the figures.
/// The flavor is a compile-time constant, so every colour below stays a `const`.
const bool _pro = AppConstants.isPro;

abstract final class AppColors {
  /// The header: easyJet orange for travellers, black for the pro.
  static const brand = _pro ? Color(0xFF0B0B0C) : Color(0xFFFF6600);

  /// The dark neutral (strong text, dark surfaces) in place of the former purple; light text on the pro's black.
  static const dark = _pro ? Color(0xFFF3F3F0) : Color(0xFF2C1A0E);
  static const accent = _pro ? Color(0xFFF5C400) : Color(0xFFFF8A3D);
  static const peach = _pro ? Color(0xFFFFE066) : Color(0xFFF0A36B);

  /// Pale tints: selected backgrounds and the light text on the header.
  static const tint = _pro ? Color(0xFF26230F) : Color(0xFFFFF1E8);
  static const tintSoft = _pro ? Color(0xFF17170F) : Color(0xFFFFF7F1);
  static const onBrandSoft = _pro ? Color(0xFFA8A8A2) : Color(0xFFFFE9D6);
  static const accentDeep = _pro ? Color(0xFFF5C400) : Color(0xFFC24E00);
  static const ink = _pro ? Color(0xFFF3F3F0) : Color(0xFF1E1E1E);
  static const muted = _pro ? Color(0xFFA8A8A2) : Color(0xFF6F6A66);
  static const line = _pro ? Color(0xFF3A3A38) : Color(0xFFECE4DE);
  static const background = _pro ? Color(0xFF0B0B0C) : Color(0xFFFFFFFF);
  static const canvas = _pro ? Color(0xFF151516) : Color(0xFFFAF5F0);

  /// Cards and sheets (white for travellers, a slightly lighter black for the pro).
  static const surface = _pro ? Color(0xFF141415) : Color(0xFFFFFFFF);

  /// Text on the primary action (white on the orange gradient, black on the yellow).
  static const onAccent = _pro ? Color(0xFF0B0B0C) : Color(0xFFFFFFFF);
  static const danger = _pro ? Color(0xFFFF6B5E) : Color(0xFFB3261E);
  static const success = _pro ? Color(0xFF6EC071) : Color(0xFF2E7D4F);

  /// French plate: EU blue band.
  static const plateBlue = Color(0xFF1F3FA6);

  static const primaryGradient = LinearGradient(begin: Alignment(-1, -0.2), end: Alignment(1, 0.2), colors: _pro ? [accent, accent] : [accent, peach]);
}

/// Corners: rounded for travellers (direction D), sharp for the pro (direction B).
abstract final class AppRadius {
  static const card = BorderRadius.all(Radius.circular(_pro ? 2 : 16));
  static const field = BorderRadius.all(Radius.circular(_pro ? 2 : 14));
  static const chip = BorderRadius.all(Radius.circular(_pro ? 2 : 12));
  static const pill = BorderRadius.all(Radius.circular(_pro ? 2 : 26));
  static const small = BorderRadius.all(Radius.circular(_pro ? 1 : 8));
}

/// Fonts: Playfair Display + Inter for travellers; Archivo Narrow + JetBrains Mono for the pro.
abstract final class AppFonts {
  static const title = _pro ? 'ArchivoNarrow' : 'PlayfairDisplay';
  static const body = 'Inter';
  static const mono = _pro ? 'JetBrainsMono' : 'Inter';
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
      _font('Inter', size, weight, color: color, height: height);
  static TextStyle muted({double size = 13.5}) => _font('Inter', size, 400, color: AppColors.muted, height: 1.45);
  static TextStyle strong({double size = 15, Color color = AppColors.ink}) => _font('Inter', size, 700, color: color);
  static TextStyle big({double size = 34, Color color = AppColors.ink}) => _font('Inter', size, 700, color: color, height: 1.1);
  static TextStyle label({double size = 12.5, Color color = AppColors.muted}) => _font('Inter', size, 600, color: color).copyWith(letterSpacing: 0.8);
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
    colorScheme: _pro ? scheme.copyWith(brightness: Brightness.dark, onSurface: AppColors.ink, onPrimary: AppColors.onAccent) : scheme,
    brightness: _pro ? Brightness.dark : Brightness.light,
    scaffoldBackgroundColor: AppColors.background,
    canvasColor: AppColors.surface,
    cardColor: AppColors.surface,
    dialogTheme: const DialogThemeData(backgroundColor: AppColors.surface),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: _pro ? BorderRadius.zero : BorderRadius.vertical(top: Radius.circular(20))),
    ),
    dividerColor: AppColors.line,
    fontFamily: 'Inter',
    textTheme: _pro ? ThemeData.dark().textTheme.apply(fontFamily: 'Inter', bodyColor: AppColors.ink, displayColor: AppColors.ink) : null,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.brand,
      foregroundColor: _pro ? AppColors.accent : Colors.white,
      elevation: 0,
      titleTextStyle: AppText.title(size: 24, color: _pro ? AppColors.accent : Colors.white),
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

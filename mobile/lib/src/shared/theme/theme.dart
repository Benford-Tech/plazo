import 'package:flutter/material.dart';

/// Direction D ("style Thempo"): easyJet-orange header (T-A, 03/10/2026), light-orange accent (V-A, 03/10/2026, in place of the
/// violet), peach for the highlight, a light-orange → peach gradient on primary actions, Playfair
/// Display titles + Inter, rounded cards.
abstract final class AppColors {
  static const brand = Color(0xFFFF6600);
  /// The dark neutral (text on light, dark surfaces) in place of the former purple.
  static const dark = Color(0xFF2C1A0E);
  static const accent = Color(0xFFFF8A3D);
  static const peach = Color(0xFFF0A36B);
  /// Pale orange tints: selected backgrounds and the light text on the orange header.
  static const tint = Color(0xFFFFF1E8);
  static const tintSoft = Color(0xFFFFF7F1);
  static const onBrandSoft = Color(0xFFFFE9D6);
  static const accentDeep = Color(0xFFC24E00);
  static const ink = Color(0xFF1E1E1E);
  static const muted = Color(0xFF6F6A66);
  static const line = Color(0xFFECE4DE);
  static const background = Color(0xFFFFFFFF);
  static const canvas = Color(0xFFFAF5F0);
  static const danger = Color(0xFFB3261E);
  static const success = Color(0xFF2E7D4F);

  /// French plate: EU blue band.
  static const plateBlue = Color(0xFF1F3FA6);

  static const primaryGradient = LinearGradient(
    begin: Alignment(-1, -0.2),
    end: Alignment(1, 0.2),
    colors: [accent, peach],
  );
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
  static TextStyle title({double size = 24, Color color = AppColors.ink}) => _font('PlayfairDisplay', size, 500, italic: true, color: color);
  static TextStyle body({double size = 15, int weight = 400, Color color = AppColors.ink, double? height}) =>
      _font('Inter', size, weight, color: color, height: height);
  static TextStyle muted({double size = 13.5}) => _font('Inter', size, 400, color: AppColors.muted, height: 1.45);
  static TextStyle strong({double size = 15, Color color = AppColors.ink}) => _font('Inter', size, 700, color: color);
  static TextStyle big({double size = 34, Color color = AppColors.ink}) => _font('Inter', size, 700, color: color, height: 1.1);
  static TextStyle label({double size = 12.5, Color color = AppColors.muted}) =>
      _font('Inter', size, 600, color: color).copyWith(letterSpacing: 0.8);
  static TextStyle tabular({double size = 15, int weight = 700, Color color = AppColors.ink}) =>
      _font('Inter', size, weight, color: color).copyWith(fontFeatures: const [FontFeature.tabularFigures()]);
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
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.background,
    fontFamily: 'Inter',
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.brand,
      foregroundColor: Colors.white,
      elevation: 0,
      titleTextStyle: AppText.title(size: 24, color: Colors.white),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.line)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.accent, width: 1.6)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
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
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating, backgroundColor: AppColors.dark),
  );
}

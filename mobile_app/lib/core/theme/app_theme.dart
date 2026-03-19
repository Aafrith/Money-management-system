import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand colors
  static const Color primaryColor = Color(0xFF6366F1);
  static const Color secondaryColor = Color(0xFF8B5CF6);
  static const Color accentColor = Color(0xFF06B6D4);

  // Semantic colors
  static const Color successColor = Color(0xFF10B981);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color infoColor = Color(0xFF3B82F6);

  // Category colors
  static const List<Color> chartColors = [
    Color(0xFF6366F1),
    Color(0xFF8B5CF6),
    Color(0xFFF59E0B),
    Color(0xFF10B981),
    Color(0xFFEF4444),
    Color(0xFF06B6D4),
    Color(0xFFEC4899),
    Color(0xFFF97316),
  ];

  static TextTheme _buildTextTheme(TextTheme base) {
    return GoogleFonts.interTextTheme(base);
  }

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorSchemeSeed: primaryColor,
    textTheme: _buildTextTheme(ThemeData.light().textTheme),
    scaffoldBackgroundColor: const Color(0xFFF8FAFC),
    appBarTheme: AppBarTheme(
      elevation: 0,
      centerTitle: false,
      backgroundColor: Colors.white,
      foregroundColor: const Color(0xFF0F172A),
      titleTextStyle: GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: const Color(0xFF0F172A),
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      color: Colors.white,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF1F5F9),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: 0,
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
        textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: primaryColor,
      unselectedItemColor: Color(0xFF94A3B8),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: primaryColor,
      foregroundColor: Colors.white,
      elevation: 4,
    ),
    dividerTheme: const DividerThemeData(
      color: Color(0xFFE2E8F0),
      thickness: 1,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: const Color(0xFFF1F5F9),
      selectedColor: primaryColor.withValues(alpha: 0.15),
      labelStyle: GoogleFonts.inter(fontSize: 13),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      side: const BorderSide(color: Color(0xFFE2E8F0)),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorSchemeSeed: primaryColor,
    textTheme: _buildTextTheme(ThemeData.dark().textTheme),
    scaffoldBackgroundColor: const Color(0xFF0F172A),
    appBarTheme: AppBarTheme(
      elevation: 0,
      centerTitle: false,
      backgroundColor: const Color(0xFF1E293B),
      foregroundColor: Colors.white,
      titleTextStyle: GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Colors.white,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF334155)),
      ),
      color: const Color(0xFF1E293B),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF1E293B),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF334155)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: 0,
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: Color(0xFF334155)),
        textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Color(0xFF1E293B),
      selectedItemColor: primaryColor,
      unselectedItemColor: Color(0xFF64748B),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: primaryColor,
      foregroundColor: Colors.white,
      elevation: 4,
    ),
    dividerTheme: const DividerThemeData(
      color: Color(0xFF334155),
      thickness: 1,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: const Color(0xFF1E293B),
      selectedColor: primaryColor.withValues(alpha: 0.25),
      labelStyle: GoogleFonts.inter(fontSize: 13),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      side: const BorderSide(color: Color(0xFF334155)),
    ),
  );
}

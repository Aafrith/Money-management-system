# Environment Setup Guide: Money Management System (Mobile)

This guide provides the exact steps and versions required to set up the development environment for the Money Management mobile application on a new Windows computer.

## 1. Prerequisites (Hardware & OS)
- **OS**: Windows 10 or 11 (64-bit).
- **RAM**: Minimum 8GB (16GB highly recommended for Android Emulator).
- **Disk Space**: At least 10GB for SDKs and tools.

## 2. Core Tools Installation

### A. Git
1. Download from [git-scm.com](https://git-scm.com/download/win).
2. Install with default settings.
3. Verify: Open PowerShell and run `git --version`.

### B. Flutter SDK
1. **Required Version**: `3.8.1` or higher.
2. Download the Flutter Windows zip from [flutter.dev](https://docs.flutter.dev/get-started/install/windows/mobile).
3. Extract to `C:\dev\flutter` (Avoid `C:\Program Files`).
4. **Environment Variable**: Add `C:\dev\flutter\bin` to your User **Path**.
5. Verify: Run `flutter --version`.

### C. Java Development Kit (JDK)
1. **Required Version**: JDK 17 (LTS).
2. Download from [Adoptium (Temurin)](https://adoptium.net/temurin/releases/?version=17).
3. Verify: Run `java -version`.

---

## 3. Android Studio & SDK Setup

### A. Installation
1. Download **Android Studio Ladybug** (or latest stable) from [developer.android.com](https://developer.android.com/studio).
2. During setup, choose "Standard" installation.

### B. SDK Manager Configuration
Open Android Studio > Settings > Languages & Frameworks > Android SDK.

1. **SDK Platforms**:
   - Check **Android 15.0 (VanillaIceCream)** (API Level 35) or **Android 14.0 (UpsideDownCake)** (API Level 34).
2. **SDK Tools** (Check "Show Package Details"):
   - **Android SDK Build-Tools 35.0.0** (or latest).
   - **NDK (Side by side)**: Version `29.0.13599879` (Required by project configuration).
   - **Android SDK Command-line Tools (latest)**.
   - **Android Emulator**.
   - **Google Play Services**.

### C. Android License Agreement
Run this in terminal to accept all licenses:
```powershell
flutter doctor --android-licenses
```

---

## 4. IDE Setup (VS Code)
1. Download from [code.visualstudio.com](https://code.visualstudio.com/).
2. Install Extensions:
   - **Dart** (by Dart Code)
   - **Flutter** (by Dart Code)

---

## 5. Project Initialization

1. **Clone the Repository**:
   ```powershell
   git clone <repository_url>
   cd Money-management-system/mobile_app
   ```
2. **Fetch Dependencies**:
   ```powershell
   flutter pub get
   ```
3. **Run Flutter Doctor**:
   ```powershell
   flutter doctor
   ```
   *Ensure there are no red 'X's for Flutter and Android.*

---

## 6. Running the App

### Using Android Emulator
1. In Android Studio, open **Device Manager**.
2. Create Device > Pixel 7 > Next.
3. Select **UpsideDownCake (API 34)** or later > Download > Finish.
4. Start the emulator.

### Launching
In VS Code, press `F5` or run:
```powershell
flutter run
```

---

## Troubleshooting
- **Gradle Error**: If you get a Java version mismatch, ensure `JAVA_HOME` points to JDK 17.
- **Missing NDK**: If the build fails mentioning NDK, double-check that version `29.0.13599879` is installed in SDK Manager.
- **CocoaPods (iOS)**: If moving to a Mac later, you will need `sudo gem install cocoapods`.

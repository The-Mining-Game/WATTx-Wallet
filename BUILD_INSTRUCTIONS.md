# WATTx Wallet - Build Instructions

## Prerequisites

### Option 1: Using Android Studio (Recommended)

1. **Install Android Studio**
   ```bash
   # Download from: https://developer.android.com/studio
   # Or via snap:
   sudo snap install android-studio --classic
   ```

2. **Open the Project**
   - Launch Android Studio
   - Click "Open" and select the `WATTxWallet/android` folder
   - Wait for Gradle sync to complete

3. **Build APK**
   - Menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Command Line Build

1. **Install Java 17**
   ```bash
   sudo apt-get update
   sudo apt-get install openjdk-17-jdk
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   ```

2. **Install Android SDK**
   ```bash
   # Set SDK path
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

   # Accept licenses
   yes | sdkmanager --licenses

   # Install required components
   sdkmanager "platforms;android-34" "build-tools;34.0.0" "ndk;25.1.8937393"
   ```

3. **Build**
   ```bash
   cd WATTxWallet
   npm install
   cd android
   ./gradlew assembleDebug
   ```

### Option 3: Docker Build

```bash
cd WATTxWallet
./build-apk.sh
```

Note: Requires Docker with good network connectivity.

## Build Outputs

- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

## Release Build

For release builds, configure signing in `android/gradle.properties`:

```properties
WATTX_UPLOAD_STORE_FILE=your-release-key.keystore
WATTX_UPLOAD_STORE_PASSWORD=your-store-password
WATTX_UPLOAD_KEY_ALIAS=your-key-alias
WATTX_UPLOAD_KEY_PASSWORD=your-key-password
```

Then run:
```bash
./gradlew assembleRelease
```

## Troubleshooting

### Memory Issues
Add to `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m
```

### Build Single Architecture (Faster)
```bash
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```

### Clean Build
```bash
./gradlew clean
./gradlew assembleDebug
```

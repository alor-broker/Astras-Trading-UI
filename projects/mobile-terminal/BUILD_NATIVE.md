# 📱 Mobile Development (Android)

This project uses [Ionic Capacitor](https://capacitorjs.com/) to run the Angular app on Android.

## Prerequisites
1.  **Node.js** and **pnpm** installed.
2.  **Android Studio** installed with Android SDK.
3.  **Java 11+** (JDK 17 recommended).

## Configuration

There are two Capacitor configurations available:

1.  **Development (`capacitor.config.dev.ts`)**:
  *   Enables **Live Reload**.
  *   Points to `http://10.0.2.2:4200` (Emulator's access to host localhost).
  *   Allows debugging in the emulator while changing code.

2.  **Production (`capacitor.config.prod.ts`)**:
  *   Standalone configuration.
  *   Runs the built app from the device storage.
  *   No dependency on the development server.

3.  **iOS Development (`capacitor.config.ios.dev.ts`)**:
  *   Same as Development, but points to `http://localhost:4200` for iOS Simulator.

To switch configurations, copy the desired file to `capacitor.config.ts`:

```bash
# For Development
copy capacitor.config.dev.ts capacitor.config.ts

# For Production
copy capacitor.config.prod.ts capacitor.config.ts
```

## Running in Development Mode (Live Reload)

1.  Set up the dev config:
    ```bash
    copy capacitor.config.dev.ts capacitor.config.ts
    ```
2.  Start the Angular dev server (accessible from emulator):
    ```bash
    ng serve --host 0.0.0.0 --disable-host-check
    ```
3.  Run the Android app:
    ```bash
    pnpm exec cap run android
    ```
    *Note: Ensure your Android Emulator is running or a device is connected.*

## Building the Standalone APK

1.  Set up the prod config:
    ```bash
    copy capacitor.config.prod.ts capacitor.config.ts
    ```
2.  Build the Angular app (Production):
    ```bash
    ng build --configuration production
    ```
    *Note: If you need to use the development environment (e.g., for dev SSO), use `--configuration development`.*
3.  Sync Capacitor:
    ```bash
    pnpm exec cap sync
    ```
4.  Build the APK:
    ```bash
    cd android
    .\gradlew assembleDebug
    ```
    The APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Debugging in Android Studio

To open the project in Android Studio:
```bash
pnpm exec cap open android
```
From Android Studio, you can run the app in Debug mode by clicking the **Debug** icon (bug symbol) instead of Run. This allows you to inspect native logs and breakpoints.

## Troubleshooting

*   **Auth Redirect Issues**: If you get `ERR_CONNECTION_REFUSED` on `localhost:4200` after login, it means the SSO is redirecting to the local dev URL. Use the **Development Mode (Live Reload)** to fix this, or ensure the SSO accepts `http://localhost` (standalone).
*   **Icons**: If icons are missing, try uninstalling the app to clear the cache.

# 📱 Mobile Development (iOS)

This project uses [Ionic Capacitor](https://capacitorjs.com/) to run the Angular app on iOS.

## Prerequisites
1.  **macOS** computer.
2.  **Xcode** installed.
3.  **CocoaPods** installed (`sudo gem install cocoapods`).
4.  **Node.js** and **pnpm** installed.

**Note:** iOS development requires a macOS environment. You cannot build or run the iOS app directly on Windows.

## Configuration

The configuration process is the same as for Android. See the [Configuration](#configuration) section above.

## Running in Development Mode (Live Reload)

1.  Set up the dev config:
    ```bash
    cp capacitor.config.ios.dev.ts capacitor.config.ts
    ```
2.  Start the Angular dev server:
    ```bash
    ng serve --host 0.0.0.0 --disable-host-check
    ```
3.  Run the iOS app:
    ```bash
    pnpm exec cap run ios
    ```

## Building the Standalone App

1.  Set up the prod config:
    ```bash
    cp capacitor.config.prod.ts capacitor.config.ts
    ```
2.  Build the Angular app (Production):
    ```bash
    ng build --configuration production
    ```
3.  Sync Capacitor:
    ```bash
    pnpm exec cap sync ios
    ```
4.  Open in Xcode:
    ```bash
    pnpm exec cap open ios
    ```
5.  In Xcode, select your target device and click the **Run** button (Play icon).

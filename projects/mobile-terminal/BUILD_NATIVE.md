# Сборка native-приложения mobile-terminal

`mobile-terminal` запускается на Android и iOS через Capacitor. Все команды выполняются из корня репозитория.

## Требования

- Node.js `>=22.0.0`.
- `pnpm` версии `11.1.3` или совместимой с `packageManager` в `package.json`.
- Установленные зависимости проекта.
- Для Android: Android Studio, Android SDK, JDK, эмулятор или подключенное устройство.
- Для iOS: macOS, Xcode, iOS Simulator или подключенное устройство.

## Capacitor конфигурации

Capacitor CLI читает активную конфигурацию из `capacitor.config.ts`. Перед запуском выбери нужный режим и скопируй соответствующий файл.

| Режим | Файл | Когда использовать |
| --- | --- | --- |
| Android live reload | `capacitor.config.dev.ts` | Запуск Android app с Angular dev server |
| iOS live reload | `capacitor.config.ios.dev.ts` | Запуск iOS app с Angular dev server |
| Standalone build | `capacitor.config.prod.ts` | Сборка приложения из файлов `dist/mobile-terminal/browser` |

PowerShell:

```powershell
Copy-Item capacitor.config.dev.ts capacitor.config.ts
```

macOS/Linux:

```bash
cp capacitor.config.dev.ts capacitor.config.ts
```

В примерах выше замени source file на `capacitor.config.ios.dev.ts` или `capacitor.config.prod.ts`, если нужен другой режим.

## Live reload

Live reload подходит для разработки. Приложение загружает UI из Angular dev server, поэтому перед запуском native app нужно держать dev server активным.

### Android

1. Активируй Android dev config:

   ```powershell
   Copy-Item capacitor.config.dev.ts capacitor.config.ts
   ```

2. Запусти Angular dev server:

   ```bash
   pnpm start:mobile -- --host 0.0.0.0
   ```

3. В другом терминале запусти Android app:

   ```bash
   pnpm exec cap run android
   ```

`capacitor.config.dev.ts` использует `http://10.0.2.2:4200`, чтобы Android emulator мог обращаться к dev server на хост-машине.

### iOS

1. Активируй iOS dev config:

   ```bash
   cp capacitor.config.ios.dev.ts capacitor.config.ts
   ```

2. Запусти Angular dev server:

   ```bash
   pnpm start:mobile -- --host 0.0.0.0
   ```

3. В другом терминале запусти iOS app:

   ```bash
   pnpm exec cap run ios
   ```

`capacitor.config.ios.dev.ts` использует `http://localhost:4200` для iOS Simulator.

## Standalone build

Standalone build не зависит от Angular dev server. Capacitor использует web bundle из `dist/mobile-terminal/browser`.

1. Активируй production config:

   PowerShell:

   ```powershell
   Copy-Item capacitor.config.prod.ts capacitor.config.ts
   ```

   macOS/Linux:

   ```bash
   cp capacitor.config.prod.ts capacitor.config.ts
   ```

2. Собери web app:

   ```bash
   pnpm build:mobile
   ```

   Для devContour окружения:

   ```bash
   pnpm build:mobile --configuration devContour
   ```

3. Синхронизируй web bundle и native projects:

   ```bash
   pnpm exec cap sync
   ```

## Android APK

После standalone build можно собрать debug APK.

PowerShell:

```powershell
Set-Location android
.\gradlew.bat assembleDebug
Set-Location ..
```

macOS/Linux:

```bash
cd android
./gradlew assembleDebug
cd ..
```

APK появится здесь:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Для открытия проекта в Android Studio:

```bash
pnpm exec cap open android
```

## iOS app

iOS app собирается на macOS.

После standalone build открой проект в Xcode:

```bash
pnpm exec cap open ios
```

Дальше выбери target device в Xcode и запусти приложение через Run или Debug.

## WebNative VS Code extension

[WebNative](https://webnative.dev/) можно использовать как UI-обертку над стандартными сценариями запуска Capacitor в VS Code. Расширение не заменяет конфигурацию проекта: `capacitor.config.ts`, `pnpm start:mobile`, `pnpm build:mobile` и `pnpm exec cap sync` остаются источником правды.

### Установка

1. Открой репозиторий в VS Code.
2. Установи расширение `WebNative` из VS Code Marketplace или найди его по запросу `WebNative` в панели Extensions.
3. Убедись, что зависимости проекта установлены и терминал VS Code видит `pnpm`.

### Запуск web preview

1. В WebNative выбери `Run` > `Web`.
2. Если расширение предлагает выбрать script, используй `start:mobile`.
3. Для preview внутри VS Code используй меню `...` рядом с `Web` и команду `Open App in Editor`.

### Запуск на Android или iOS

1. Скопируй нужную Capacitor конфигурацию в `capacitor.config.ts`.
2. Для live reload включи в WebNative `Settings` > `Live Reload`.
3. Запусти `Run` > `Android` или `Run` > `iOS` и выбери устройство.
4. Если нужен запуск через native IDE, используй `Build` в WebNative, затем запускай проект в Android Studio или Xcode.

### WebNative App на устройстве

Для проверки web preview на реальном устройстве можно использовать WebNative App из App Store или Play Store.

1. Запусти `Run` > `Web` в WebNative.
2. Убедись, что компьютер и мобильное устройство находятся в одной Wi-Fi сети.
3. Dev server должен быть доступен по внешнему IP адресу, поэтому для ручного запуска используется `pnpm start:mobile -- --host 0.0.0.0`.
4. Открой WebNative App на устройстве: приложение должно обнаружить запущенный web app.

## Troubleshooting

- Если после login в Android emulator появляется `ERR_CONNECTION_REFUSED` на `localhost:4200`, проверь, что активен `capacitor.config.dev.ts`. Для Android emulator URL должен быть `http://10.0.2.2:4200`.
- Если standalone app не обновился после изменения web-кода, повтори `pnpm build:mobile`, затем `pnpm exec cap sync`.
- Если static assets или icons выглядят устаревшими, удали приложение с устройства или emulator и установи заново.
- Если `pnpm exec cap run android` не видит устройство, сначала проверь его в Android Studio или командой Android SDK `adb devices`.
- Если `pnpm exec cap run ios` не видит устройство или simulator, открой проект через `pnpm exec cap open ios` и выбери target в Xcode.

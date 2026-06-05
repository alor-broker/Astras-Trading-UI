# mobile-terminal

UI-приложение Web-терминала и Android/iOS приложений для мобильных устройств.

## Команды

### Локальный запуск

```bash
pnpm start:mobile
```

### Production сборка

```bash
pnpm build:mobile
```

### DevContour сборка

```bash
pnpm build:mobile --configuration devContour
```

## Виджеты

Доступные приложению виджеты регистрируются в `projects/mobile-terminal/src/app/widget-registry.ts` через `WIDGET_COMPONENT_REGISTRY`.

При добавлении виджета в mobile-приложение:

1. Убедись, что код виджета находится в `projects/terminal-widgets-lib/src/widgets`.
2. Добавь или обнови metadata в `projects/terminal-widgets-lib/src/assets/widgets-meta-config.json`.
3. Добавь компонент виджета в `MOBILE_WIDGET_REGISTRY`.
4. Не дублируй metadata в приложении: registry содержит только соответствие widget type id и компонента.

Provider registry подключается в `projects/mobile-terminal/src/app/dashboard.providers.ts`.

## Общие ресурсы

App-specific ресурсы хранятся в `projects/mobile-terminal/public`. Все, что лежит в `public/assets`, доступно приложению по пути `/assets/...`.

Общие ресурсы подключаются через `assets` в `angular.json`:

- `projects/terminal-styling-lib/src/custom_icons` -> `/assets/`;
- `projects/terminal-styling-lib/src/pwa-icons` -> `/assets/pwa-icons`;
- `projects/terminal-i18n/i18n` -> `/assets/i18n`;
- `projects/terminal-core-lib/src/assets` -> `/assets/`;
- `projects/terminal-widgets-lib/src/assets` -> `/assets/`.

Не добавляй копии общих иконок, переводов или widget assets в `public`. Если ресурс нужен нескольким приложениям, размещай его в соответствующей общей библиотеке и подключай через общий assets pipeline.

## Переопределение стилей

Глобальные стили приложения находятся в `projects/mobile-terminal/src/styles/styles.less`.

Mobile-приложение использует собственные theme entry files в `projects/mobile-terminal/src/styles/themes`, которые подключают ng-zorro theme, app-level переменные и `css-vars-mapping`. Общий `utils` из `terminal-styling-lib` подключается в `angular.json`.

App-level overrides добавляй в `src/styles/styles.less`, `src/styles/ng-zorro-overrides` или `src/styles/themes`, если переопределение относится только к mobile-приложению. Если стиль должен быть общим для нескольких приложений, меняй `projects/terminal-styling-lib`.

В component styles используй CSS variables через `var(...)`, а не Less variables. Для ng-zorro overlays добавляй class компонента и оборачивай overlay styles в него.

## Проверки перед завершением изменений

Для изменений только в `mobile-terminal` запускай:

```bash
pnpm lint
pnpm build:mobile
```

Если изменилась логика, шаблоны, сервисы или тесты приложения, дополнительно запускай:

```bash
pnpm test:mobile -- --no-watch
```

Если изменение затрагивает общие библиотеки, общие assets, темы или widgets, проверь consuming приложения через:

```bash
pnpm build:all
```

Для изменений, влияющих на Capacitor, native assets или установочный пакет, дополнительно сверяйся с `projects/mobile-terminal/BUILD_NATIVE.md`.

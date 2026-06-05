# desktop-terminal

UI-приложение Web-терминала для desktop версии.

## Команды

### Локальный запуск

```bash
pnpm start:desktop
```

### Production сборка

```bash
pnpm build:desktop
```

### DevContour сборка

```bash
pnpm build:desktop --configuration devContour
```

## Виджеты

Доступные приложению виджеты регистрируются в `projects/desktop-terminal/src/app/widget-registry.ts` через `WIDGET_COMPONENT_REGISTRY`.

При добавлении виджета в desktop-приложение:

1. Убедись, что код виджета находится в `projects/terminal-widgets-lib/src/widgets`.
2. Добавь или обнови metadata в `projects/terminal-widgets-lib/src/assets/widgets-meta-config.json`.
3. Добавь компонент виджета в `DESKTOP_WIDGET_REGISTRY`.
4. Не дублируй metadata в приложении: registry содержит только соответствие widget type id и компонента.

Provider registry подключается в `projects/desktop-terminal/src/app/dashboard.providers.ts`.

## Общие ресурсы

App-specific ресурсы хранятся в `projects/desktop-terminal/public`. Все, что лежит в `public/assets`, доступно приложению по пути `/assets/...`.

Общие ресурсы подключаются через `assets` в `angular.json`:

- `projects/terminal-styling-lib/src/custom_icons` -> `/assets/`;
- `projects/terminal-styling-lib/src/pwa-icons` -> `/assets/pwa-icons`;
- `projects/terminal-i18n/i18n` -> `/assets/i18n`;
- `projects/terminal-core-lib/src/assets` -> `/assets/`;
- `projects/terminal-widgets-lib/src/assets` -> `/assets/`.

Не добавляй копии общих иконок, переводов или widget assets в `public`. Если ресурс нужен нескольким приложениям, размещай его в соответствующей общей библиотеке и подключай через общий assets pipeline.

## Переопределение стилей

Глобальные стили приложения находятся в `projects/desktop-terminal/src/styles/styles.less`.

Desktop-приложение использует theme bundles из `terminal-styling-lib`, подключенные в `angular.json`: `dark-theme`, `light-theme` и общий `utils`. App-level overrides добавляй в `src/styles/styles.less` или в отдельные файлы рядом с ним, сохраняя понятную структуру импортов.

Если стиль должен быть общим для нескольких приложений, меняй `projects/terminal-styling-lib`. Если переопределение нужно только desktop-приложению, оставляй его в `projects/desktop-terminal/src/styles`.

В component styles используй CSS variables через `var(...)`, а не Less variables. Для ng-zorro overlays добавляй class компонента и оборачивай overlay styles в него.

## Проверки перед завершением изменений

Для изменений только в `desktop-terminal` запускай:

```bash
pnpm lint
pnpm build:desktop
```

Если изменилась логика, шаблоны, сервисы или тесты приложения, дополнительно запускай:

```bash
pnpm test:desktop -- --no-watch
```

Если изменение затрагивает общие библиотеки, общие assets, темы или widgets, проверь consuming приложения через:

```bash
pnpm build:all
```

# terminal-i18n

`terminal-i18n` содержит общие переводы для всех приложений терминала.

Сюда добавляются:

- переводы виджетов из `terminal-widgets-lib`;
- переводы core компонентов и сервисов из `terminal-core-lib`;
- общие переводы, которые должны быть доступны всем приложениям.

Если перевод относится только к одному приложению, добавляй его в папку этого приложения: `./public/assets/i18n` относительно приложения.

## Как переводы попадают в приложения

Содержимое `terminal-i18n` копируется в output папку `/assets/i18n` каждого приложения через настройки `architect/options` в `angular.json`.

Переводы загружаются через transloco loader.

## Структура scope

Каждый файл перевода содержит JSON object. Значения свойств — строки переводов или вложенные JSON objects.

При добавлении переводов соблюдай иерархию папок:

| Уровень | Назначение | Пример |
| --- | --- | --- |
| 1 | Feature, widget или core component | `mobile-home-screen` |
| 2 | Дочерний component или дочерняя функциональность | `news`, `portfolio-evaluation`, `positions` |

Можно создавать больше уровней, но это не рекомендуется: в шаблонах увеличивается длина translation keys.

Пример: для виджета `mobile-home-screen` создана папка первого уровня `mobile-home-screen`. В ней находятся общие `ru.json`, `en.json`, `hy.json`, а также папки второго уровня для частей виджета: `news`, `portfolio-evaluation`, `positions`.

## Правила добавления переводов

- Каждый scope должен включать русский, английский и армянский варианты: `ru.json`, `en.json`, `hy.json`.
- Папки переводов именуй в kebab case.
- Для enum values рекомендуется создавать вложенные JSON objects. Пример: ключ `statuses` в `projects/terminal-i18n/i18n/portfolio-risk-gauge/ru.json`.
- При ручном добавлении сначала заполни `ru.json`, затем сгенерируй `en.json` и `hy.json` скриптом `../../scripts/generate-translations.js`, если доступен Open Router key.
- При добавлении новых ключей сохраняй одинаковую структуру во всех языковых файлах scope.

## Использование в классе

Для переводов в component class или service используй `TranslatorService`.

Путь сервиса: `projects/terminal-core-lib/src/features/translations/services/translator.service.ts`.

Порядок:

1. Инжектируй `TranslatorService`.
2. Вызови `getTranslator(scope)`, где `scope` — путь до папки перевода относительно папки `i18n`.
3. Используй возвращенную функцию-переводчик.
4. Передавай в функцию массив, где каждое значение — имя свойства JSON object.

Пример использования: `projects/terminal-core-lib/src/features/orders/services/margin-order-notification.service.ts`.

## Использование в шаблоне

Для переводов в template используй `TranslocoDirective`.

Рекомендуется объявлять transloco directive внутри `ng-container`.

Пример использования: `projects/terminal-widgets-lib/src/widgets/mobile-home-screen/components/mobile-home-screen-content/mobile-home-screen-content.html`.

## AI checklist перед изменениями

- Определен correct scope: общий, widget, core component или app-specific.
- App-specific перевод не добавлен в `terminal-i18n`.
- Папки scope названы в kebab case.
- Добавлены или обновлены все три файла: `ru.json`, `en.json`, `hy.json`.
- Структура ключей одинакова во всех языках.
- Для enum-like значений использованы вложенные JSON objects.
- В class code используется `TranslatorService`.
- В template используется `TranslocoDirective`.

## Связанные документы

- `AGENTS.md` — общие правила для AI агентов.
- `projects/terminal-core-lib/README.md` — правила core библиотеки.
- `projects/terminal-widgets-lib/README.md` — правила переводов для общих виджетов.

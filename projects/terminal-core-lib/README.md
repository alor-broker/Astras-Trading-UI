# terminal-core-lib

`terminal-core-lib` содержит общие компоненты, пайпы, директивы, типы, сервисы, утилиты и assets, которые доступны всем приложениям терминала.

## Назначение

Используй этот проект для функциональности, которая:

- нужна нескольким приложениям;
- используется несколькими виджетами;
- относится к общей инфраструктуре терминала;
- не является частью конкретного приложения.

Не размещай здесь код, завязанный на конкретное приложение.

## Границы импортов

`terminal-core-lib` не должен импортировать другие проекты репозитория.

Допустимо:

- импортировать Angular, RxJS, ng-zorro и другие внешние зависимости проекта;
- импортировать файлы внутри `terminal-core-lib`.

Недопустимо:

- импортировать приложения;
- импортировать `terminal-widgets-lib`;
- импортировать `terminal-styling-lib` или `terminal-i18n` как источник runtime логики.

## Структура

| Папка | Что хранить |
| --- | --- |
| `assets` | Общее содержимое, доступное приложению по `/assets` и используемое сервисами проекта |
| `common` | Общие компоненты, пайпы, директивы, типы, сервисы и утилиты, которые используются повсеместно и не образуют отдельную feature |
| `config` | Типы и injection tokens для конфигураций |
| `features` | Функциональные блоки, сгруппированные по предметной области |

## Features

Каждая папка внутри `features` соответствует отдельной feature. Файлы внутри feature распределяй по подпапкам:

- `components`;
- `pipes`;
- `directives`;
- `services`;
- `types`;
- `utils`;
- `store`;
- `hooks` для файлов, реализующих интерфейс `Hook`.

Feature должна объединять файлы одной функциональности. Не смешивай в одной feature несвязанные области.

## Services и providers

- Предпочитай `@Injectable({ providedIn: 'root' })`.
- Если сервис является singleton и не хранит feature/page/component scoped state, используй `@Injectable({ providedIn: 'root' })`.
- Если сервис хранит состояние конкретной страницы, диалога, wizard-flow, временный timer или другой state, который должен сбрасываться при уничтожении feature, не делай его singleton. Подключай такой сервис через provider текущей feature/component.
- Если сервис не может быть `providedIn: 'root'`, например инжектит token, который не доступен в root или намеренно scoped к feature/component, объявляй providers в отдельном файле с суффиксом `.providers`.
- Пример provider-файла: `projects/terminal-core-lib/src/features/terminal-settings/terminal-settings-storage.providers.ts`.
- Перед созданием нового общего сервиса проверь каталог `CORE_SERVICES.md`.

## HTTP clients и контракты

- HTTP client service должен инкапсулировать endpoint URL, `HttpClient` вызов и обработку контрактных HTTP ошибок через `catchHttpError(...)`.
- Component/state services должны работать с типизированным результатом API service (`T`, `T | null`, discriminated union), а не разбирать `HttpErrorResponse`.
- DTO и enum values добавляй только для реально используемого endpoint. Если OpenAPI schema содержит значение, которое описание относит к другому API, не включай его в клиентский тип этого feature.
- Для Angular-created services, hooks, components и directives предпочитай `DestroyRef` + `takeUntilDestroyed(...)`; ручной `destroy$` оставляй только для не-Angular lifecycle или существующего механизма, который нельзя заменить локально.

## Выбор механизма состояния

Правила выбора между NgRx, RxJS-сервисами, signals, storage brokers и events bus вынесены в [STATE_MANAGEMENT.md](../../STATE_MANAGEMENT.md).

## Когда добавлять код в `common`

Добавляй код в `common`, если он:

- не относится к отдельной feature;
- используется в разных областях приложения;
- является универсальной инфраструктурной частью.

Если код связан с конкретной предметной областью, создай или используй папку внутри `features`.

## AI checklist перед изменениями

- Определена область: `common`, `config`, `assets` или конкретная `feature`.
- Проверен `CORE_SERVICES.md`, если задача связана с сервисами.
- Новый сервис не дублирует существующий.
- Для нового state выбран механизм по [STATE_MANAGEMENT.md](../../STATE_MANAGEMENT.md).
- Не добавлены импорты из других проектов репозитория.
- Providers вынесены в `.providers` файл, если `providedIn: 'root'` невозможен.
- Новые файлы размещены в правильных подпапках feature.

## Связанные документы

- `AGENTS.md` — общие правила для AI агентов.
- [STATE_MANAGEMENT.md](../../STATE_MANAGEMENT.md) — правила выбора механизма состояния.
- `projects/terminal-core-lib/CORE_SERVICES.md` — каталог ключевых сервисов.
- `projects/terminal-core-lib/GRAPHQL_CONTRACTS.md` — процесс обновления GraphQL-контрактов.
- `projects/terminal-widgets-lib/README.md` — правила для общих виджетов.

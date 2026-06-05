# Инструкции для AI агентов

Этот репозиторий содержит Angular/TypeScript приложения и общие библиотеки терминала. AI агент должен писать поддерживаемый, типобезопасный, производительный и доступный код, соблюдая правила ниже и локальную документацию проекта.

## Перед началом изменений

1. Определи, какой проект затрагивается: приложение, `terminal-core-lib`, `terminal-widgets-lib`, `terminal-styling-lib` или `terminal-i18n`.
2. Прочитай README соответствующего проекта перед изменениями.
3. Если работа связана с общими сервисами, проверь `projects/terminal-core-lib/CORE_SERVICES.md` перед созданием нового сервиса.
4. Если работа связана со стилями, проверь правила `projects/terminal-styling-lib/README.md`.
5. Если работа связана с переводами, проверь правила `projects/terminal-i18n/README.md`.
6. Если работа связана с API-контрактами, HTTP/WebSocket методами, DTO или клиентскими сервисами, проверь [API_DOCUMENTATION.md](API_DOCUMENTATION.md).
7. Если работа связана с тестами (написание или изменение `*.spec.ts`, тестовых фикстур, моков, билдеров), проверь правила в [projects/testing-lib/README.md](projects/testing-lib/README.md).

## Границы проектов

| Проект | Назначение | Важное ограничение |
| --- | --- | --- |
| `terminal-core-lib` | Общие компоненты, сервисы, типы, утилиты, features и assets для всех приложений | Не импортирует другие проекты репозитория |
| `terminal-widgets-lib` | Общие виджеты дашбордов | Не импортирует приложения; допускаются импорты из `terminal-core-lib` |
| `terminal-styling-lib` | Общие темы, CSS variables, utility classes, mixins и overrides | Изменения влияют на все приложения |
| `terminal-i18n` | Общие переводы для приложений, виджетов и core компонентов | Для каждого scope нужны `ru.json`, `en.json`, `hy.json` |
| `testing-lib` | Переиспользуемые фикстуры, моки, провайдеры и хелперы для тестов; правила написания тестов | Только тестовое окружение; не попадает в production-сборку и не импортируется из `*.ts` приложений и библиотек |

## Внутренние library-проекты и проверки

`terminal-core-lib`, `terminal-widgets-lib`, `terminal-styling-lib` и `terminal-i18n` являются внутренними container libraries workspace. Они группируют общий код, стили, assets и переводы для UI-приложений, но не публикуются как отдельные npm-пакеты и не являются самостоятельными release artifacts.

- Не считай отсутствие `build` target у этих проектов проблемой. Их работоспособность проверяется через consuming UI-приложения: `desktop-terminal`, `mobile-terminal` и `admin-terminal`.
- `terminal-core-lib` и `terminal-widgets-lib` имеют собственные `lint` targets, потому что содержат TypeScript и Angular templates.
- `terminal-styling-lib` и `terminal-i18n` не имеют Angular lint targets, потому что текущий ESLint pipeline проверяет TS/HTML, а эти проекты содержат стили/assets и JSON-переводы.
- `pnpm lint` запускает `ng lint --max-warnings 0` и должен затрагивать как UI-приложения, так и `terminal-core-lib`/`terminal-widgets-lib`.
- Локальные `tsconfig.json` в `terminal-core-lib` и `terminal-widgets-lib` нужны для type-aware ESLint project service. Не удаляй их как лишние build-конфиги.
- Если изменение в общей библиотеке может повлиять на приложение, запускай build соответствующего consuming приложения. Для общих изменений с широким охватом используй `pnpm build:all`.

## TypeScript

- Используй strict type checking.
- Предпочитай вывод типов, когда тип очевиден.
- Не используй `any`; если тип неизвестен, используй `unknown`.
- Для ограниченных наборов доменных значений предпочитай `enum`, а не union из строковых литералов.
- Держи преобразования данных чистыми и предсказуемыми.

## Observables и RxJS

- Переменные, поля и параметры, содержащие `Observable` (`Subject`, `BehaviorSubject` и прочие потоки RxJS), именуй с суффиксом `$` (`data$`, `isActive$`, `currentState$`). И наоборот: суффикс `$` используется только для потоков — не вешай его на обычные значения (значение из потока называй `value`/`item`, а не `value$`).
- Любой RxJS `subscribe(...)` должен иметь понятный lifecycle: для одноразовых операций используй `take(1)`/`first()` или другой завершающий оператор; для подписок компонентов, директив и сервисов используй `takeUntilDestroyed`, `OnDestroy` с явным `unsubscribe`, либо существующий lifecycle/teardown-механизм сервиса. Не оставляй долгоживущие подписки без закрытия.
- `Subject`, `BehaviorSubject` и другие вручную созданные subjects должны завершаться через `complete()` в lifecycle владельца (`ngOnDestroy`, `DestroyRef.onDestroy`, `destroy()` и т.п.), если они не являются намеренно долгоживущим state singleton.

## Angular

- Используй standalone components.
- Не указывай `standalone: true` в декораторах Angular: в Angular v20+ это значение по умолчанию.
- Для feature routes используй lazy loading.
- Не используй `@HostBinding` и `@HostListener`; host bindings задавай через `host` в `@Component` или `@Directive`.
- Для статических изображений используй `NgOptimizedImage`.
- Не используй `NgOptimizedImage` для inline base64 изображений.

## Components

- Компонент должен быть небольшим и отвечать за одну задачу.
- Используй `input()` и `output()` вместо decorator-based inputs/outputs.
- Для производных значений используй `computed()`.
- В `@Component` указывай `changeDetection: ChangeDetectionStrategy.OnPush`.
- В `@Component` указывай `encapsulation: ViewEncapsulation.None`.
- Предпочитай Reactive Forms вместо Template-driven Forms.
- Не используй `ngClass`; используй bindings для `class`.
- Не используй `ngStyle`; используй bindings для `style`.
- Пути к внешним templates/styles должны быть относительными к TS файлу компонента.
- При использовании ng-zorro компонентов форм и таблиц импортируй NzFormModule и NzTableModule целиком, а не отдельные компоненты.

## State Management

- Для локального состояния используй signals.
- Для производного состояния используй `computed()`.
- Не используй `mutate` на signals; используй `update` или `set`.
- Функции работы с signals, которым нужен Angular injection context, вызывай только в injection context; если вызов вне него необходим, передавай `Injector` через options.

## Templates

- Держи шаблоны простыми, без сложной логики.
- Используй native control flow: `@if`, `@for`, `@switch`.
- Не используй `*ngIf`, `*ngFor`, `*ngSwitch`.
- Для observables используй async pipe.
- Не предполагай, что globals вроде `new Date()` доступны в шаблоне.
- Не пиши arrow functions в шаблонах.
- Максимально используй существующие компоненты ng-zorro
- Для часто повторяющихся CSS правил предпочитай utilities из `projects/terminal-styling-lib/src/styles/utils`.
- Все пользовательские текстовые метки, подписи, заголовки, placeholders, tooltips, сообщения об ошибках и пустых состояниях должны идти через переводы.
- Для каждой новой или измененной текстовой метки должны быть добавлены переводы на три языка: русский `ru.json`, английский `en.json`, армянский `hy.json`.

## Styles

- Все стили компонента оборачивай в selector компонента.
- Если используется `nz-modal`, `nz-dropdown` или другой overlay component, добавляй class компонента и оборачивай overlay styles в него.
- Используй CSS variables из `css-vars-mapping.less`.
- Новые общедоступные CSS variables должны иметь префикс `--ats`.
- Не обращайся из компонентов напрямую к Less переменным, включая переменные ng-zorro.
- Для стандартных смысловых цветов текста используй готовые utility-классы из `projects/terminal-styling-lib/src/styles/utils/color-utils.less`, например `buy-color`, `sell-color`, `positive-color`, `negative-color`, вместо локальных классов компонента вроде `buy`, `sell`, `positive`, `negative`.
- Держи selectors простыми, сохраняй иерархию и избегай дублирования styles.
- Используй только flexbox. Не используй grid

## Services

- Сервис должен иметь одну ответственность.
- Для singleton services используй `@Injectable({ providedIn: 'root' })`.
- Используй `inject()` вместо constructor injection.
- Перед созданием нового общего сервиса проверь, нет ли подходящего сервиса в `CORE_SERVICES.md`.
- Если сервис не может быть `providedIn: 'root'`, выноси providers в отдельный файл с суффиксом `.providers`.

## Общие рекомендации рекомендации

- Для получения нормализованного ключа инструмента из объектов с `symbol`, `exchange`, `isin`, `instrumentGroup` используй `InstrumentKeyHelper.toInstrumentKey`, а не ручную сборку объекта `InstrumentKey`.


## AI checklist перед завершением

- Проверены README затронутых проектов.
- Не нарушены границы импортов между проектами.
- Для UI изменений соблюдены Angular, template и style правила.
- Для всех новых или измененных пользовательских текстовых меток добавлены переводы на `ru`, `en`, `hy`.
- Для виджетов обновлены metadata и registry там, где это требуется по README.
- Если изменения затрагивают внешние API-контракты, они сверены с [API_DOCUMENTATION.md](API_DOCUMENTATION.md).
- Для новых или изменённых тестов соблюдены правила [projects/testing-lib/README.md](projects/testing-lib/README.md), а переиспользуемые фикстуры/моки вынесены в `testing-lib`.
- Все новые или изменённые RxJS `subscribe(...)` имеют явное завершение или lifecycle teardown.
- Изменения не создают дублирующий сервис, utility class или переводческий scope без необходимости.

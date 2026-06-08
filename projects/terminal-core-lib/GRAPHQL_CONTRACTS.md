# Обновление GraphQL-контрактов

Этот документ описывает, как обновлять сгенерированные TypeScript-типы и Zod-схемы для GraphQL API.

## Источник схем

GraphQL-схемы обновляются с dev-контура:

- `https://apidev.alor.ru/hyperion/` — контракты инструментов и Hyperion;
- `https://apidev.alor.ru/news/graphql` — контракты новостей.

Dev-контур является источником для codegen, потому что именно там появляются последние актуальные изменения контрактов. Перед релизом учитывай, что dev-схема может опережать prod: если изменение критично для пользовательского сценария, согласуй совместимость с владельцами backend API.

## Что генерируется

Конфигурации codegen находятся в корне репозитория:

- `hyperion-codegen.ts`;
- `news-codegen.ts`.

Сгенерированные файлы лежат в `terminal-core-lib`:

- `projects/terminal-core-lib/src/features/instruments/graphql/schema/graphql.types.ts`;
- `projects/terminal-core-lib/src/features/instruments/graphql/schema/graphql.schemas.ts`;
- `projects/terminal-core-lib/src/features/news/graphql/schema/graphql.types.ts`;
- `projects/terminal-core-lib/src/features/news/graphql/schema/graphql.schemas.ts`.

Эти файлы являются общими контрактами для приложений и виджетов. Не редактируй их вручную: изменения должны приходить через GraphQL codegen.

## Когда обновлять

Обновляй GraphQL-контракты, когда:

- backend изменил GraphQL schema;
- frontend начинает использовать новое поле, input, enum или query/mutation contract;
- типы или Zod-схемы расходятся с фактическим ответом GraphQL API;
- после обновления backend на dev-контуре нужно подтянуть последние изменения в UI.

## Процесс обновления

1. Убедись, что зависимости установлены через `pnpm install`.
2. Проверь доступность dev-контура `https://apidev.alor.ru`.
3. Запусти нужный codegen:

```bash
pnpm codegen-hyperion
pnpm codegen-news
```

4. Просмотри diff сгенерированных файлов и проверь, что изменения соответствуют ожидаемому backend-контракту.
5. Если изменились типы, которые используются в сервисах, виджетах или gql-схемах ответов, обнови соответствующий код и локальные Zod-схемы.
6. Для изменений в общей библиотеке запусти проверку consuming приложений. Минимально проверь затронутое приложение, для широких изменений используй:

```bash
pnpm build:all
```

7. Если обновлялись тесты, соблюдай правила `projects/testing-lib/README.md`.

## Проверка перед завершением

- В diff нет ручных правок внутри сгенерированных `graphql.types.ts` и `graphql.schemas.ts`, кроме результата codegen.
- Изменения сверены с dev-схемой, а не с prod-схемой.
- Новые или измененные GraphQL-поля обработаны в сервисах, компонентах и Zod-схемах ответов.
- Для критичных сценариев проверена совместимость с backend API перед релизом.
- Запущены релевантные build/test/lint проверки или явно указано, почему они не запускались.

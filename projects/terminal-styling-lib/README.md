# terminal-styling-lib

`terminal-styling-lib` содержит общие стили, темы, CSS variables, utility classes, mixins, overrides ng-zorro компонентов и иконки для приложений терминала.

## Назначение

Используй этот проект для стилей и визуальных настроек, которые должны быть доступны нескольким приложениям.

Изменения в этом проекте могут повлиять на все приложения. Если стиль нужен только одному приложению, переопредели или дополни его в папке стилей этого приложения.

## Темы

Папка `themes` содержит базовые настройки светлой и темной тем для desktop версии.

Основные файлы:

- `projects/terminal-styling-lib/src/styles/themes/dark-theme.less`;
- `projects/terminal-styling-lib/src/styles/themes/light-theme.less`;
- `projects/terminal-styling-lib/src/styles/themes/css-vars-mapping.less`.

`dark-theme.less` и `light-theme.less` подключают theme files в нужной последовательности и затем подключаются к приложениям как CSS files через `angular.json`.

Приложение может переопределить переменные. Пример: `projects/mobile-terminal/src/styles/themes/light-theme.less`.

## CSS variables

Компоненты не имеют доступа к объявленным Less переменным, включая переменные ng-zorro. В компонентах используй CSS custom properties через `var(...)`.

Если нужно открыть доступ к ng-zorro переменной или добавить общедоступную переменную:

1. Добавь ее в `projects/terminal-styling-lib/src/styles/themes/css-vars-mapping.less`.
2. Используй префикс `--ats`.
3. Используй переменную в компонентах через `var(--ats-...)`.

## Utility classes

Папка `utils` содержит вспомогательные classes для шаблонов компонентов.

Используй utilities вместо дублирования одинаковых стилей в компонентах. Содержимое `utils` можно дополнять по мере необходимости.

Именование utilities соответствует подходу Bootstrap utilities: `https://getbootstrap.com/docs/5.3/utilities`.

Для стандартных смысловых цветов текста используй готовые классы из `src/styles/utils/color-utils.less`: `buy-color`, `sell-color`, `positive-color`, `negative-color`, `warning-color` и другие. Не создавай локальные классы компонента вроде `buy`, `sell`, `positive`, `negative`, если они только повторяют эти utilities.

## ng-zorro overrides

Папка `ng-zorro-overrides` содержит корректировки стилей ng-zorro компонентов.

Правила:

- группируй overrides по файлам;
- имя файла должно отражать компонент, к которому относятся overrides;
- не смешивай overrides разных компонентов без необходимости.

## Mixins

Папка `mixins` содержит Less mixins с группами часто используемых стилей.

Используй mixins для общих Less patterns. Не используй mixin как способ обойти правило доступа компонентов к CSS variables.

## Переопределения в приложениях

Приложение может переопределять и дополнять стили из `terminal-styling-lib`.

Если приложение дополняет или переопределяет файлы этого проекта:

- поддерживай такую же иерархию папок;
- сохраняй именование файлов;
- делай структуру переопределений очевидной для чтения.

Пример app-level styles: `projects/mobile-terminal/src/styles`.

## AI checklist перед изменениями

- Понятно, должен ли стиль быть общим для всех приложений или локальным для одного приложения.
- Для component styles используются CSS variables через `var(...)`, а не Less variables.
- Новая общедоступная CSS variable добавлена в `css-vars-mapping.less` и имеет префикс `--ats`.
- Повторяющиеся component styles вынесены в `utils`, если это действительно общий pattern.
- Стандартные смысловые цвета текста заданы через utility-классы из `color-utils.less`, а не через локальные классы компонента.
- ng-zorro overrides размещены в `ng-zorro-overrides` и сгруппированы по компоненту.
- App-specific overrides сохраняют структуру папок и именование исходных файлов.

## Связанные документы

- `AGENTS.md` — общие правила для AI агентов.

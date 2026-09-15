# Floating window

`FloatingWindow` — немодальное окно с собственной оболочкой и стилями. Angular CDK Overlay размещает его вне clipping-контейнеров виджетов. Подложки нет, прокрутка страницы и взаимодействие с фоном доступны, клик снаружи не закрывает окно.

## Открытие через сервис

```ts
import {FloatingWindowService} from '@terminal-core-lib/features/floating-window/services/floating-window.service';
import {FloatingWindowPolicy} from '@terminal-core-lib/features/floating-window/types/floating-window.types';

const windows = inject(FloatingWindowService);
const ref = windows.open<MyData, MyResult>(MyContent, {
  data,
  title: translatedTitle,
  injector: inject(Injector),
  owner: inject(DestroyRef),
  width: 700,
  resizable: true,
  groupId: 'details',
  policy: FloatingWindowPolicy.OnePerGroup
});
```

`inject()` в примере вызывается в injection context; для обработчика события заранее сохраните injector и DestroyRef в полях. Компонент содержимого получает `FloatingWindowRef<MyData, MyResult>` через `injectFloatingWindowRef<MyData, MyResult>()`. `ref.data()` — реактивные данные. Для шаблонов доступны `let-data` и `let-window="window"`.

`open()` возвращает ссылку либо `null`, если открытие отклонено или владелец уже уничтожен. При конфликте существующее окно поднимается и подсвечивается без создания нового компонента и замены данных. `get<D, R>(id)` ищет открытое окно; типы должны соответствовать первоначальному открытию с этим id.

- `update(options)` обновляет данные и параметры отображения без пересоздания содержимого. Явная смена width/height сбрасывает ручной размер; изменение только данных, title или footer сохраняет геометрию. Контент, id, группа, политика и injector фиксируются при открытии.
- `activate()` поднимает окно, переводит в него фокус и подсвечивает рамку. `bringToFront()` меняет только порядок.
- `setOwner(destroyRef)` передаёт ответственность за закрытие другому владельцу. Контекст DI уже созданного компонента не заменяется; меняющиеся зависимости передавайте в data.
- `close(result)` закрывает окно программно, минуя OK/Cancel. `afterOpened$`, `afterClosed$`, `actionErrors$` и `activated$` завершаются при закрытии. `afterOpened$` и `afterClosed$` воспроизводят последнее событие позднему подписчику.
- OK/Cancel вызывают соответствующий handler; `false` запрещает закрытие. Promise ожидается с индикатором загрузки и блокировкой повторных действий. Ошибка передаётся через `actionErrors$`, окно остаётся открытым. Обработчик может сам вызвать `close(result)`.

## Декларативное использование

Добавьте `FloatingWindow` из `@terminal-core-lib/features/floating-window/components/floating-window/floating-window` в `imports` компонента.

```html
<ng-template #content let-data>{{ data.description }}</ng-template>
<ats-floating-window [(visible)]="visible"
                     [content]="content"
                     [options]="windowOptions()"
                     windowId="details"
                     groupId="details"
                     [policy]="windowPolicies.OnePerGroup"
                     (afterClosed)="onClosed($event)"/>
```

`options` содержит data и параметры отображения из `FloatingWindowOptions`. События: `afterOpened`, `afterClosed`, `actionError`, `openRejected`. При отклонении открытия visible возвращается в false. При уничтожении declaring component окно закрывается без отправки событий уничтоженному компоненту.

## Геометрия и оформление

- По умолчанию: центр viewport, ширина 520 px, высота по содержимому, drag включён, resize выключен. Числовые размеры задаются в px; строки разрешают CSS-единицы и выражения.
- `origin: {x, y}` принимает clientX/clientY; левый верхний угол смещается на offsetX/offsetY. Без origin окно центрируется.
- Минимум 280 × 160 px, отступ от viewport 8 px; на маленьком экране минимум уменьшается. minWidth/minHeight/maxWidth/maxHeight позволяют задать другие ограничения. Геометрия повторно ограничивается при изменении viewport.
- `fullScreen` заполняет viewport без отступов, отключает drag/resize. Размеры и положение не сохраняются между открытиями.
- При появлении окно плавно увеличивается и проявляется за 200 мс, как nz-modal. Анимация запускается после подготовки позиции; `afterOpened$` приходит после её завершения. При `prefers-reduced-motion` окно появляется без анимации.
- Заголовок — строка или TemplateRef. Footer: undefined — OK/Cancel, TemplateRef — пользовательский, null — отсутствует. `panelClass` добавляется на `ats-floating-window-shell` для локальных переопределений.
- Перемещение: заголовок мышью/касанием либо стрелками при фокусе на заголовке. Resize: края/углы мышью/касанием либо стрелками при фокусе на маркере. Шаг клавиатуры 10 px, с Shift — 1 px.
- Окно не удерживает фокус. Escape работает при фокусе внутри окна, учитывает keyboard/closable и приоритет вложенных CDK overlays. Плавающие окна остаются ниже обычных модальных диалогов и dropdown.
- Собственные стили не используют CSS/classes nz-modal. Тень берётся из `--ats-floating-window-shadow`, остальные параметры — из существующих CSS variables терминала. Новые служебные подписи находятся в scope `floating-window` на ru/en/hy.

## Ограничения количества

`groupId` по умолчанию common. Политики: Multiple (по умолчанию), OnePerGroup, OneOverall. Запрет учитывается с обеих сторон: существующее ограничение нельзя обойти новым окном с Multiple. При нескольких конфликтах активируется последний активный кандидат. Уникальный id также запрещает повторное создание.

Реестр `FloatingWindowService` имеет lifetime приложения и хранит только открытые ссылки/overlays. Состояние принадлежит отдельному окну. Уничтожение владельца, навигация и `closeAll()` освобождают overlays, listeners и таймеры. Не храните данные feature в singleton-сервисе поверх этого реестра.

## Структура feature

- `components/floating-window` — декларативный API открытия и события Angular.
- `components/floating-window-shell` — оболочка окна, разметка, стили и взаимодействие с DOM.
- `services` — инфраструктурный реестр `FloatingWindowService` и жизненный цикл отдельного окна `FloatingWindowRef`, включая `injectFloatingWindowRef`.
- `types` — параметры, контекст содержимого, геометрические модели и enum политики открытия.
- `utils` — чистые расчёты положения и размеров окна.

Тесты находятся рядом с проверяемыми компонентами, сервисами и утилитами. Общие тестовые заглушки остаются в `testing-lib`.

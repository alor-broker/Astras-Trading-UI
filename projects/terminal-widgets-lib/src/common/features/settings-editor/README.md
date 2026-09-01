# Settings editor

Общий, адаптивный под устройство редактор настроек виджета. Один и тот же редактор на desktop открывается как модальный диалог рядом с кнопкой-шестерёнкой, а на mobile отображается inline внутри виджета. Логика работы с настройками (форма, сохранение, копирование, валидность) не дублируется между устройствами — различается только представление.

Структура папки: `components/`, `services/`, `directives/`, `types/` (модели в файлах `*.types.ts`), `utils/` (хелперы в файлах `*.helper.ts`) и `styles/` (общие миксины и стили редактора, не принадлежащие отдельному компоненту).

## Когда использовать

- **Для нового виджета с настройками** — используй этот редактор, не пиши собственный.
- **При миграции существующего виджета** — переводи `*-settings` компонент на `WidgetSettingsBase` + `<ats-widget-settings-editor>` вместо старого `WidgetSettings` / `nz-collapse`.

Эталон миграции — `tech-chart` (`src/widgets/tech-chart`).

> Немигрированные виджеты продолжают работать по legacy-пути (`ats-widget-skeleton [settings] [showSettings]` + `WidgetBase.toggleSettings()`). Не смешивай два подхода в одном виджете: либо редактор, либо legacy.

## Из чего состоит

| Элемент | Что это | Когда трогать |
| --- | --- | --- |
| `WidgetSettingsBase<T>` (`common/widget-settings.base.ts`) | Базовый класс `*-settings` компонента: форма, `settings$`, save/copy, валидность, открытие/закрытие редактора | Наследуй в каждом settings-компоненте |
| `<ats-widget-settings-editor>` (`WidgetSettingsEditor`) | Точка входа в шаблоне settings-компонента; управляет открытием desktop-диалога/mobile-редактора и связывает их с публичным API | Используй в шаблоне |
| `<ats-widget-settings-group>` (`WidgetSettingsGroup`) | Объявление одной логической группы настроек (заголовок + поля) | По одной на каждую группу |
| `atsWidgetHeader` / `atsWidgetContent` | Именованные projection-slot'ы шапки и основного содержимого `WidgetSkeleton` | Используй в новых и мигрированных виджетах |
| `atsWidgetSettingsEditor` (`WidgetSettingsEditorSlot`) | Маркер projection-slot для settings-компонента внутри skeleton | Добавляй на settings-компонент в шаблоне виджета |
| `WidgetSettingsGroupSelector` | Desktop-навигация: выбирает активную группу, проверяет возможность перехода и показывает её поля | Внутренняя деталь desktop-layout |
| `WidgetSettingsAuxPanel` | Отображает стандартные aux-переключатели в ориентации текущей раскладки | Внутренняя деталь layout-компонентов |
| `WidgetSettingsPlaceholder` | Заглушка основного содержимого во время desktop-редактирования | Внутренняя деталь редактора |
| `*atsSettingsDeviceVisible` (`SettingsDeviceVisible`) | Структурная директива видимости отдельного поля по устройству | Для скрытия конкретного поля на desktop/mobile |
| `SettingsDeviceVisibility` (enum) | `All` / `DesktopOnly` / `MobileOnly` | Для `[device]` группы и для директивы |
| `WidgetSettingsAuxToggle` (тип) | Стандартизированный переключатель aux-панели (`{ id, icon, tooltip }`) | Если у виджета есть aux-панель |
| `WidgetSettingsLayout{Desktop,Mobile}` | Компонуют элементы соответствующей раскладки; каждый владеет только своей разметкой и стилями | Не трогай напрямую — подключаются редактором |
| `WidgetSettingsDialogService` | CDK-overlay диалога на desktop | Внутренняя деталь, вызывается редактором |
| `WidgetSettingsEditorRef` (тип) | Минимальный контракт интеграции: skeleton получает сигнал скрытия основного содержимого | Реализован редактором; `WidgetSettingsBase` проксирует его в skeleton |

## Как мигрировать виджет (пошагово)

### 1. Settings-компонент наследует `WidgetSettingsBase`

```ts
@Component({
  selector: 'ats-x-settings',
  templateUrl: './x-settings.html',
  imports: [WidgetSettingsEditor, WidgetSettingsGroup, /* SettingsDeviceVisible, формы, nz-* */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class XSettings extends WidgetSettingsBase<XWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  // enum доступен в шаблоне
  readonly DeviceVisibility = SettingsDeviceVisibility;

  override get canSave(): boolean {
    return this.form.valid;
  }

  // ...форма, getUpdatedSettings, setCurrentFormValues
}
```

`WidgetSettingsBase` уже даёт: `guid`, `settings$`, `openSettings(trigger)`, `updateSettings()`, `requestClose()`, `createWidgetCopy()`, геттеры `showCopy`/`canSave`/`canCopy`, а также реализацию `WidgetSettingsEditorRef`. Реализуй только абстрактные `getUpdatedSettings()` и `setCurrentFormValues()`.

### 2. Организуй reactive form по группам UI

Структурируй форму вложенными подгруппами, совпадающими с группами на экране. Тогда валидность группы — это просто `form.controls.<group>.valid`, без отдельных сигналов валидности.

```ts
readonly form = this.formBuilder.group({
  instrument: this.formBuilder.group({ /* ... */ }),
  portfolioIndicators: this.formBuilder.group({ /* ... */ }),
  // ...
});
```

`getUpdatedSettings` / `setCurrentFormValues` мапят вложенную форму ↔ плоский DTO настроек.

### 3. Шаблон settings-компонента

```html
<ats-widget-settings-editor
  (cancelClick)="requestClose()"
  (copyClick)="createWidgetCopy()"
  (saveClick)="updateSettings()"
  [canCopy]="canCopy"
  [canSave]="canSave"
  [showPlaceholder]="true"
  [showCopy]="showCopy"
  [widgetInstance]="widgetInstance()"
>
  <ats-widget-settings-group
    [isValid]="form.controls.instrument.valid"
    [title]="t('xSettings.instrumentGroupLabel')"
    groupId="instrument"
  >
    <div [formGroup]="form.controls.instrument" nz-form>
      <!-- поля группы -->
    </div>
  </ats-widget-settings-group>

  <!-- остальные группы -->
</ats-widget-settings-editor>
```

Правила:

- Каждая группа оборачивает свой `[formGroup]` (корневой `form` или подгруппу) — так DI формы работает через `ngTemplateOutlet`.
- `<ats-widget-settings-group>` содержит **только** настройки. Кнопки/переключатели режима — это aux-панель (см. ниже), не группа.
- Заголовок группы (`[title]`) передавай уже переведённым.
- Если настройки простые и групп нет — проецируй поля напрямую в `<ats-widget-settings-editor>` без `<ats-widget-settings-group>`.

### 4. Видимость по устройству (без `@if (isMobile)`)

Не используй ad-hoc `@if (isMobile)`. Применяй единый механизм:

- **Группа целиком:** `[device]="DeviceVisibility.DesktopOnly"` на `<ats-widget-settings-group>`.
- **Отдельное поле:** `*atsSettingsDeviceVisible="DeviceVisibility.DesktopOnly"` на элементе.
- **Бизнес-видимость** (например, скрыть группу для синтетического инструмента) — через `[isVisible]` группы.

```html
<ats-widget-settings-group [device]="DeviceVisibility.DesktopOnly" ...>...</ats-widget-settings-group>

<nz-form-item *atsSettingsDeviceVisible="DeviceVisibility.DesktopOnly" class="one-row">...</nz-form-item>
```

### 5. Aux-панель (опционально)

Если у виджета есть взаимоисключающие режимы-переключатели, опиши их как `WidgetSettingsAuxToggle[]` и реагируй на активный id:

```html
<ats-widget-settings-editor
  [(activeAuxToggle)]="activeMode"
  [auxToggles]="auxToggles"
  ...
>
```

Первый переключатель активен по умолчанию. На desktop панель вертикальная (сверху), на mobile — горизонтальная (закреплена сверху). У `tech-chart` aux-панели нет — его тумблер `allowCustomTimeframes` вынесен в обычную группу «Прочее».

### 6. Шаблон виджета

Шапка, основное содержимое и settings-компонент проецируются в именованные slot'ы skeleton. Settings-компонент также передаётся в него ссылкой:

```html
<ats-widget-skeleton
  [isBlockWidget]="isBlockWidget()"
  [settingsEditor]="settingsCmp"
>
  <ng-container atsWidgetHeader>
    <ats-widget-header (switchSettings)="settingsCmp.openSettings($event)" [hasSettings]="true" .../>
  </ng-container>
  <ng-container atsWidgetContent>
    <!-- контент виджета -->
  </ng-container>

  <ats-x-settings
    #settingsCmp
    [guid]="guid"
    [widgetInstance]="widgetInstance()"
    atsWidgetSettingsEditor
  />
</ats-widget-skeleton>
```

- `(switchSettings)="settingsCmp.openSettings($event)"` — единый триггер (клик по шестерёнке) для desktop и mobile. Метод сам решает: overlay или inline. Повторный клик на mobile закрывает редактор.
- `atsWidgetHeader`, `atsWidgetContent` и `atsWidgetSettingsEditor` образуют единый projection API skeleton. Инпуты `[header]`, `[content]`, `[settings]` и `[showSettings]` с `TemplateRef` оставлены только как deprecated fallback для legacy-виджетов; не используй их в новом коде.
- `atsWidgetSettingsEditor` помещает settings-компонент в предназначенный для редактора projection-slot skeleton.
- `[settingsEditor]="settingsCmp"` передаёт ссылку (`WidgetSettingsEditorRef`); skeleton использует только сигнал скрытия основного содержимого. Выбор mobile-layout/placeholder и их отображение остаются внутри редактора.
- `[showPlaceholder]="true"` на `<ats-widget-settings-editor>` — **опционально**. Включи для виджетов, которые не применяют настройки «на лету»: пока открыт desktop-диалог, редактор показывает в виджете собственную заглушку «Редактирование настроек». На mobile редактор всегда показывает inline-layout вместо основного содержимого.
- Убери из skeleton legacy-инпуты `[header]` / `[content]` / `[settings]` / `[showSettings]`.

### 7. Переводы (i18n)

- Общие подписи самого редактора (заголовок диалога, тултипы, placeholder) — в scope `shared/widget-settings`.
- Заголовки групп и подписи полей — в собственном scope виджета.
- Для каждой новой/изменённой метки добавляй переводы во все три локали: `ru.json`, `en.json`, `hy.json`.

## Поведение desktop vs mobile

Редактор device-agnostic: desktop и mobile представлены отдельными шаблонами. Desktop-шаблон передаётся в overlay, mobile-шаблон — в content slot скелетона. Различия:

| | Desktop | Mobile |
| --- | --- | --- |
| Контейнер | Модальный диалог (CDK overlay) у шестерёнки | Inline в слоте редактора виджета (шапка виджета видна) |
| Раскладка | Колонки: aux \| навигация групп \| поля | Стек секций; aux горизонтально сверху |
| Заголовок | Есть (`Настройки: {имя}`) + кнопка закрытия | Нет (закрытие через шестерёнку/Сохранить) |
| Футер | Копировать (слева), Отменить, Сохранить | Только Сохранить |
| Навигация | Невалидную активную группу нельзя покинуть, пока не исправлена | Все секции видны сразу |
| Закрытие | Кнопки и Esc; клик по фону НЕ закрывает | Шестерёнка / Сохранить |

## Чеклист перед завершением

- [ ] Settings-компонент наследует `WidgetSettingsBase`, форма разбита на подгруппы под UI, `[isValid]` биндится на `form.controls.<group>.valid`.
- [ ] Нет ad-hoc `@if (isMobile)` вокруг полей/групп — только `SettingsDeviceVisibility` + директива/`[device]`.
- [ ] В шаблоне виджета: header/content/settings помечены named slots, settings-компонент передан через ref; `(switchSettings)` → `openSettings($event)`; legacy TemplateRef-инпуты убраны.
- [ ] Модели — в `*.types.ts`, без `export function` (используй классы-хелперы).
- [ ] Переводы новых меток добавлены в `ru`/`en`/`hy`.
- [ ] Стили компонента не нужны для общих `.one-row` рядов — они уже в `styles/widget-settings-controls.less`.

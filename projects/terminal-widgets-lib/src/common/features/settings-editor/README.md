# Settings editor

Общий, адаптивный под устройство редактор настроек виджета. Один и тот же редактор на desktop отображает настройки в стандартном перетаскиваемом `nz-modal`, а на mobile — inline внутри виджета. `WidgetSkeleton` владеет состоянием открытия, переключением шаблонов, placeholder и подсветкой активного виджета; `WidgetSettingsEditor` отвечает только за представление формы. Логика работы с настройками (форма, сохранение, копирование, валидность) не дублируется между устройствами.

Структура папки: `components/`, `directives/`, `types/` (модели в файлах `*.types.ts`), `utils/` (хелперы в файлах `*.helper.ts`) и `styles/` (общие миксины и стили редактора, не принадлежащие отдельному компоненту).

## Когда использовать

- **Для нового виджета с настройками** — используй этот редактор, не пиши собственный.
- **При миграции существующего виджета** — переводи `*-settings` компонент на `WidgetSettingsBase` + `<ats-widget-settings-editor>` вместо старого `WidgetSettings` / `nz-collapse`.

Эталон миграции — `tech-chart` (`src/widgets/tech-chart`).

> Немигрированные виджеты продолжают работать по legacy-пути (`ats-widget-skeleton [settings] [showSettings]` + `WidgetBase.toggleSettings()`). Не смешивай два подхода в одном виджете: либо редактор, либо legacy.

## Из чего состоит

| Элемент | Что это | Когда трогать |
| --- | --- | --- |
| `WidgetSettingsBase<T>` (`common/widget-settings.base.ts`) | Базовый класс `*-settings` компонента: форма, `settings$`, save/copy, валидность и запрос закрытия | Наследуй в каждом settings-компоненте |
| `<ats-widget-settings-editor>` (`WidgetSettingsEditor`) | Представление формы настроек: выбирает desktop-диалог или mobile-layout и эмитит действия пользователя | Используй в шаблоне |
| `<ats-widget-settings-group>` (`WidgetSettingsGroup`) | Объявление одной логической группы настроек (заголовок + поля) | По одной на каждую группу |
| `<ats-widget-settings-form>` (`WidgetSettingsForm`) | Стандартная vertical-форма с фиксированной ng-zorro конфигурацией | Оборачивай поля каждой группы вместе с `[formGroup]` |
| `<ats-widget-settings-form-item>` (`WidgetSettingsFormItem`) | Стандартные `form-item`, label и validation control для произвольного проецируемого контрола | Используй для input, select, slider и составных контролов |
| `<ats-widget-settings-switch>` (`WidgetSettingsSwitch`) | Самостоятельный boolean form control с компактной подписью | Используй напрямую с `formControlName` вместо `nz-switch` |
| `<ats-widget-settings-color-picker>` (`WidgetSettingsColorPicker`) | Самостоятельный string form control выбора цвета с компактной подписью | Используй напрямую с `formControlName` вместо `nz-color-picker` |
| `[header]` / `[content]` | Явные TemplateRef-инпуты шапки и основного содержимого `WidgetSkeleton` | Skeleton управляет созданием и уничтожением этих областей |
| `[settingsEditorContent]` | TemplateRef-инпут settings-компонента внутри skeleton | Skeleton создаёт редактор только на время открытых настроек |
| `WidgetSettingsGroupSelector` | Desktop-навигация: выбирает активную группу, проверяет возможность перехода и показывает её поля | Внутренняя деталь desktop-layout |
| `WidgetSettingsPlaceholder` | Заглушка основного содержимого во время desktop-редактирования | Внутренняя деталь `WidgetSkeleton` |
| `*atsSettingsDeviceVisible` (`SettingsDeviceVisible`) | Структурная директива видимости отдельного поля по устройству | Для скрытия конкретного поля на desktop/mobile |
| `SettingsDeviceVisibility` (enum) | `All` / `DesktopOnly` / `MobileOnly` | Для `[device]` группы и для директивы |
| `WidgetSettingsLayout{Desktop,Mobile}` | Компонуют элементы соответствующей раскладки; каждый владеет только своей разметкой и стилями | Не трогай напрямую — подключаются редактором |

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

`WidgetSettingsBase` уже даёт: `guid`, `settings$`, `updateSettings()`, `requestClose()`, `createWidgetCopy()`, output `closeRequested` и геттеры `showCopy`/`canSave`/`canCopy`. Реализуй только абстрактные `getUpdatedSettings()` и `setCurrentFormValues()`.

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
  [showCopy]="showCopy"
  [widgetInstance]="widgetInstance()"
>
  <ats-widget-settings-group
    [isValid]="form.controls.instrument.valid"
    [title]="t('xSettings.instrumentGroupLabel')"
    groupId="instrument"
  >
    <ats-widget-settings-form [formGroup]="form.controls.instrument">
      <ats-widget-settings-form-item
        [errorTip]="t('xSettings.instrumentError')"
        [label]="t('xSettings.instrumentLabel')"
        [required]="true"
      >
        <ats-inline-instrument-search formControlName="instrumentKey"/>
      </ats-widget-settings-form-item>

      <ats-widget-settings-switch
        [label]="t('xSettings.showDetailsLabel')"
        formControlName="showDetails"
      />
    </ats-widget-settings-form>
  </ats-widget-settings-group>

  <!-- остальные группы -->
</ats-widget-settings-editor>
```

Правила:

- Каждая группа оборачивает свой `[formGroup]` (корневой `form` или подгруппу) в `<ats-widget-settings-form>` — так DI формы работает через `ngTemplateOutlet`, а layout остаётся единым.
- Не используй напрямую `nz-form`, `nz-form-item`, `nz-form-label` и `nz-form-control`: их структура и настройки принадлежат общим компонентам.
- Для input, select, slider и составных контролов используй `<ats-widget-settings-form-item>`; `controlId` определяется из проецируемого `FormControlName`, а для контрола без него передаётся явно.
- Switch и выбор цвета не требуют `form-item`-враппера: используй `<ats-widget-settings-switch>` и `<ats-widget-settings-color-picker>` как самостоятельные Reactive Forms controls.
- `<ats-widget-settings-group>` содержит только поля одной логической группы настроек.
- Заголовок группы (`[title]`) передавай уже переведённым.
- Если настройки простые и групп нет — проецируй поля напрямую в `<ats-widget-settings-editor>` без `<ats-widget-settings-group>`.

### 4. Видимость по устройству (без `@if (isMobile)`)

Не используй ad-hoc `@if (isMobile)`. Применяй единый механизм:

- **Группа целиком:** `[device]="DeviceVisibility.DesktopOnly"` на `<ats-widget-settings-group>`.
- **Отдельное поле:** `*atsSettingsDeviceVisible="DeviceVisibility.DesktopOnly"` на элементе.
- **Бизнес-видимость** (например, скрыть группу для синтетического инструмента) — через `[isVisible]` группы.

```html
<ats-widget-settings-group [device]="DeviceVisibility.DesktopOnly" ...>...</ats-widget-settings-group>

<ats-widget-settings-switch
  *atsSettingsDeviceVisible="DeviceVisibility.DesktopOnly"
  [label]="t('xSettings.desktopOptionLabel')"
  formControlName="desktopOption"
/>
```

### 5. Шаблон виджета

Шапка, основное содержимое и settings-компонент передаются в skeleton явными TemplateRef-инпутами. Состоянием открытия, placeholder и lifecycle основного содержимого владеет skeleton:

```html
<ats-widget-skeleton
  #widgetSkeleton
  [content]="contentRef"
  [header]="headerRef"
  [isBlockWidget]="isBlockWidget()"
  [settingsEditorContent]="settingsEditorRef"
  [showPlaceholder]="true"
>
  <ng-template #headerRef>
    <ats-widget-header (switchSettings)="widgetSkeleton.toggleSettings()" [hasSettings]="true" .../>
  </ng-template>
  <ng-template #contentRef>
    <!-- контент виджета -->
  </ng-template>

  <ng-template #settingsEditorRef>
    <ats-x-settings
      (closeRequested)="widgetSkeleton.closeSettings()"
      [guid]="guid"
      [widgetInstance]="widgetInstance()"
    />
  </ng-template>
</ats-widget-skeleton>
```

- `WidgetSkeleton.toggleSettings()` — единый триггер открытия/закрытия. На каждом открытии skeleton создаёт новый settings-компонент, поэтому форма получает актуальные сохранённые значения.
- `[header]` и `[content]` явно передают skeleton шаблоны обычных областей. Skeleton уничтожает основной content на mobile и при desktop-placeholder.
- `[settingsEditorContent]` передаёт шаблон settings-компонента. Он существует только пока настройки открыты; `closeRequested` возвращает управление skeleton.
- `[showPlaceholder]="true"` на `<ats-widget-skeleton>` — **опционально**. Включи для виджетов, основной content которых нужно уничтожать во время desktop-редактирования. На mobile основной content уничтожается всегда.
- `WidgetSettingsEditor` отвечает только за представление формы: выбирает desktop modal или mobile layout и эмитит действия пользователя. Он не управляет переключением между content и настройками.
- Не проецируй содержимое внутрь skeleton: передавай `header`, `content` и новый редактор через соответствующие TemplateRef-инпуты. `[settings]` / `[showSettings]` оставлены только для legacy-редакторов.

### 6. Переводы (i18n)

- Общие подписи инфраструктуры настроек (заголовок диалога, тултипы и placeholder скелетона) — в scope `shared/widget-settings`.
- Заголовки групп и подписи полей — в собственном scope виджета.
- Для каждой новой/изменённой метки добавляй переводы во все три локали: `ru.json`, `en.json`, `hy.json`.

## Поведение desktop vs mobile

Редактор device-agnostic: desktop и mobile представлены отдельными шаблонами. Desktop-шаблон передаётся в `nz-modal`, mobile-шаблон отображается внутри созданного skeleton settings-компонента. Различия:

| | Desktop | Mobile |
| --- | --- | --- |
| Контейнер | Стандартный перетаскиваемый `nz-modal`; активный виджет подсвечен рамкой | Inline вместо основного содержимого виджета (шапка видна) |
| Раскладка | Навигация групп и поля | Стек секций |
| Заголовок | Есть (`Настройки: {имя}`) + кнопка закрытия | Нет (закрытие через шестерёнку/Сохранить) |
| Футер | Копировать (слева), Отменить, Сохранить | Только Сохранить |
| Навигация | Невалидную активную группу нельзя покинуть, пока не исправлена | Все секции видны сразу |
| Закрытие | Кнопки и Esc; клик по фону НЕ закрывает | Шестерёнка / Сохранить |

## Чеклист перед завершением

- [ ] Settings-компонент наследует `WidgetSettingsBase`, форма разбита на подгруппы под UI, `[isValid]` биндится на `form.controls.<group>.valid`.
- [ ] Нет ad-hoc `@if (isMobile)` вокруг полей/групп — только `SettingsDeviceVisibility` + директива/`[device]`.
- [ ] В шаблоне виджета: `header`, `content` и `settingsEditorContent` переданы через TemplateRef-инпуты; `(switchSettings)` → `widgetSkeleton.toggleSettings()`; `closeRequested` → `widgetSkeleton.closeSettings()`.
- [ ] Модели — в `*.types.ts`, без `export function` (используй классы-хелперы).
- [ ] Переводы новых меток добавлены в `ru`/`en`/`hy`.
- [ ] Поля используют `WidgetSettingsForm` и общие form controls; прямых `nz-form*` и локальной настройки `nzLayout` нет.
- [ ] Компактная разметка switch/color-picker задаётся их собственными стилями; служебные layout-классы в шаблонах settings-компонента не используются.

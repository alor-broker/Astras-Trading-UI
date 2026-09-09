import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsLayoutDesktop} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-layout-desktop/widget-settings-layout-desktop';
import {WidgetSettingsLayoutMobile} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-layout-mobile/widget-settings-layout-mobile';
import {WidgetsHelper} from '@terminal-widgets-lib/common/utils/widget-name.helper';

/**
 * Presentational settings editor. Its lifecycle and the switch between regular
 * widget content and settings are owned by WidgetSkeleton. This component only
 * selects the device-specific layout and exposes user actions.
 *
 * Flexible content:
 * - settings may be declared in `<ats-widget-settings-group>` blocks (the editor
 *   shows group navigation), OR projected directly without any group (simple
 *   settings).
 */
@Component({
  selector: 'ats-widget-settings-editor',
  imports: [
    TranslocoDirective,
    NzModalModule,
    WidgetSettingsLayoutDesktop,
    WidgetSettingsLayoutMobile
  ],
  templateUrl: './widget-settings-editor.html',
  styleUrl: './widget-settings-editor.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsEditor {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly canSave = input.required<boolean>();

  readonly canCopy = input.required<boolean>();

  readonly showCopy = input(false);

  readonly saveClick = output();

  readonly cancelClick = output();

  readonly copyClick = output();

  protected readonly groups = contentChildren(WidgetSettingsGroup, {descendants: true});

  protected readonly visibleGroups = computed(() => this.groups().filter(group => group.effectiveVisible()));

  private readonly translatorService = inject(TranslatorService);

  protected readonly widgetName = computed(() => {
    const meta = this.widgetInstance().widgetMeta;

    return meta != null
      ? WidgetsHelper.getWidgetName(meta.widgetName, this.translatorService.getActiveLang())
      : '';
  });

  protected readonly isMobile = toSignal(
    inject(DeviceService).deviceInfo$.pipe(map(info => info.isMobile)),
    {initialValue: false}
  );
}

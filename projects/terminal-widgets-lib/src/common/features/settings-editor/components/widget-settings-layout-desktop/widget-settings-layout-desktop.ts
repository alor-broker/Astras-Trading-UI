import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {WidgetsHelper} from '@terminal-widgets-lib/common/utils/widget-name.helper';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsGroupSelector} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group-selector/widget-settings-group-selector';
import {WidgetSettingsAuxPanel} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-aux-panel/widget-settings-aux-panel';
import {WidgetSettingsAuxToggle} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-toggle.types';
import {WidgetSettingsAuxPanelOrientation} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-panel.types';

/**
 * Desktop presentation of the settings editor: title header with close button,
 * the aux toggle column, the groups navigation + fields (or direct content when
 * there are no groups), and the Copy/Cancel/Save footer.
 */
@Component({
  selector: 'ats-widget-settings-layout-desktop',
  imports: [
    NgTemplateOutlet,
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    NzTooltipDirective,
    WidgetSettingsGroupSelector,
    WidgetSettingsAuxPanel
  ],
  templateUrl: './widget-settings-layout-desktop.html',
  styleUrl: './widget-settings-layout-desktop.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsLayoutDesktop {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly auxToggles = input.required<readonly WidgetSettingsAuxToggle[]>();

  readonly activeAuxToggle = input.required<string | null>();

  readonly groups = input.required<readonly WidgetSettingsGroup[]>();

  readonly defaultContent = input.required<TemplateRef<unknown> | null>();

  readonly canSave = input.required<boolean>();

  readonly canCopy = input.required<boolean>();

  readonly showCopy = input.required<boolean>();

  readonly auxToggleSelect = output<string>();

  readonly saveClick = output();

  readonly cancelClick = output();

  readonly copyClick = output();

  protected readonly hasGroups = computed(() => this.groups().length > 0);

  protected readonly AuxPanelOrientation = WidgetSettingsAuxPanelOrientation;

  private readonly translatorService = inject(TranslatorService);

  protected readonly widgetName = computed(() => {
    const meta = this.widgetInstance().widgetMeta;

    return meta != null
      ? WidgetsHelper.getWidgetName(meta.widgetName, this.translatorService.getActiveLang())
      : '';
  });
}

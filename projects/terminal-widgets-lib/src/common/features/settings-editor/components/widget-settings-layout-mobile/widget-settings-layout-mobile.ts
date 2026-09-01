import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsAuxPanel} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-aux-panel/widget-settings-aux-panel';
import {WidgetSettingsAuxToggle} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-toggle.types';
import {WidgetSettingsAuxPanelOrientation} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-panel.types';

/**
 * Mobile presentation of the settings editor: no title header (the widget header
 * stays visible), the aux toggles pinned on top, the group sections stacked in a
 * scrollable column (or direct content when there are no groups), and a Save-only
 * footer (closing is done via the widget gear).
 */
@Component({
  selector: 'ats-widget-settings-layout-mobile',
  imports: [
    NgTemplateOutlet,
    TranslocoDirective,
    NzButtonComponent,
    WidgetSettingsAuxPanel
  ],
  templateUrl: './widget-settings-layout-mobile.html',
  styleUrl: './widget-settings-layout-mobile.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsLayoutMobile {
  readonly auxToggles = input.required<readonly WidgetSettingsAuxToggle[]>();

  readonly activeAuxToggle = input.required<string | null>();

  readonly groups = input.required<readonly WidgetSettingsGroup[]>();

  readonly defaultContent = input.required<TemplateRef<unknown> | null>();

  readonly canSave = input.required<boolean>();

  readonly auxToggleSelect = output<string>();

  readonly saveClick = output();

  protected readonly hasGroups = computed(() => this.groups().length > 0);

  protected readonly AuxPanelOrientation = WidgetSettingsAuxPanelOrientation;
}

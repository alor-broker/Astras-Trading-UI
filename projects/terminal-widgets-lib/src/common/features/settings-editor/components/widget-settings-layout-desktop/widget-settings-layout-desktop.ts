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
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsAuxToggle} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-toggle.types';

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
    NzTooltipDirective
  ],
  templateUrl: './widget-settings-layout-desktop.html',
  styleUrl: './widget-settings-layout-desktop.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsLayoutDesktop {
  readonly widgetName = input.required<string>();

  readonly auxToggles = input.required<readonly WidgetSettingsAuxToggle[]>();

  readonly activeAuxToggle = input.required<string | null>();

  readonly navGroups = input.required<readonly WidgetSettingsGroup[]>();

  readonly activeGroup = input.required<WidgetSettingsGroup | null>();

  readonly canLeaveCurrent = input.required<boolean>();

  readonly defaultContent = input.required<TemplateRef<unknown> | null>();

  readonly canSave = input.required<boolean>();

  readonly canCopy = input.required<boolean>();

  readonly showCopy = input.required<boolean>();

  readonly auxToggleSelect = output<string>();

  readonly groupSelect = output<string>();

  readonly saveClick = output();

  readonly cancelClick = output();

  readonly copyClick = output();

  readonly hasGroups = computed(() => this.navGroups().length > 0);

  onGroupSelect(group: WidgetSettingsGroup, isActive: boolean): void {
    if (isActive) {
      return;
    }

    this.groupSelect.emit(group.groupId());
  }
}

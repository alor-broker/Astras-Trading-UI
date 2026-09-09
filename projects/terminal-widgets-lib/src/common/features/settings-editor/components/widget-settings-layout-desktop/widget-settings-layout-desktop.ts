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
import {WidgetSettingsGroupSelector} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group-selector/widget-settings-group-selector';

/**
 * Desktop modal content: groups navigation + fields (or direct content when
 * there are no groups), and the Copy/Cancel/Save footer.
 * The title and close button belong to the surrounding nz-modal.
 */
@Component({
  selector: 'ats-widget-settings-layout-desktop',
  imports: [
    NgTemplateOutlet,
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    NzTooltipDirective,
    WidgetSettingsGroupSelector
  ],
  templateUrl: './widget-settings-layout-desktop.html',
  styleUrl: './widget-settings-layout-desktop.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsLayoutDesktop {
  readonly groups = input.required<readonly WidgetSettingsGroup[]>();

  readonly defaultContent = input.required<TemplateRef<unknown>>();

  readonly canSave = input.required<boolean>();

  readonly canCopy = input.required<boolean>();

  readonly showCopy = input.required<boolean>();

  readonly saveClick = output();

  readonly cancelClick = output();

  readonly copyClick = output();

  protected readonly hasGroups = computed(() => this.groups().length > 0);
}

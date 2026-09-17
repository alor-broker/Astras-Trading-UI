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

/**
 * Mobile presentation of the settings editor: no title header (the widget header
 * stays visible), the group sections stacked in a scrollable column (or direct
 * content when there are no groups), and a Save-only footer (closing is done via
 * Save or the widget gear).
 */
@Component({
  selector: 'ats-widget-settings-layout-mobile',
  imports: [
    NgTemplateOutlet,
    TranslocoDirective,
    NzButtonComponent
  ],
  templateUrl: './widget-settings-layout-mobile.html',
  styleUrl: './widget-settings-layout-mobile.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsLayoutMobile {
  readonly groups = input.required<readonly WidgetSettingsGroup[]>();

  readonly defaultContent = input.required<TemplateRef<unknown>>();

  readonly canSave = input.required<boolean>();

  readonly saveClick = output();

  protected readonly hasGroups = computed(() => this.groups().length > 0);
}

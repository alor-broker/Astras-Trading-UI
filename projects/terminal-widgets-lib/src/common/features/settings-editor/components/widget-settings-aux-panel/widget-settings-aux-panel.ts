import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {WidgetSettingsAuxToggle} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-toggle.types';
import {WidgetSettingsAuxPanelOrientation} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-panel.types';

/** Renders the optional editor mode switches in a layout-specific orientation. */
@Component({
  selector: 'ats-widget-settings-aux-panel',
  imports: [
    NzIconDirective,
    NzTooltipDirective
  ],
  templateUrl: './widget-settings-aux-panel.html',
  styleUrl: './widget-settings-aux-panel.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsAuxPanel {
  readonly toggles = input.required<readonly WidgetSettingsAuxToggle[]>();

  readonly activeToggle = input.required<string | null>();

  readonly orientation = input.required<WidgetSettingsAuxPanelOrientation>();

  readonly toggleSelect = output<string>();

  protected readonly isVertical = computed(() => this.orientation() === WidgetSettingsAuxPanelOrientation.Vertical);

  protected readonly tooltipPlacement = computed(() => this.isVertical() ? 'right' : 'bottom');
}

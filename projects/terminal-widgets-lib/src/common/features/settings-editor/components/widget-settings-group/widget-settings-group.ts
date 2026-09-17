import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
  viewChild
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';
import {SettingsDeviceVisibilityHelper} from '@terminal-widgets-lib/common/features/settings-editor/utils/widget-settings-visibility.helper';

/**
 * Declarative settings group. A widget settings component declares one of these
 * per logical group; the fields go into its content (captured as a template).
 * The surrounding `WidgetSettingsEditor` collects all groups and renders them
 * according to the current device, without the widget knowing about layout.
 */
@Component({
  selector: 'ats-widget-settings-group',
  template: `
    <ng-template>
      <ng-content/>
    </ng-template>`,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsGroup {
  readonly fieldsTpl = viewChild.required(TemplateRef);

  /** Stable identifier used for selection/tracking. */
  readonly groupId = input.required<string>();

  /** Already-translated group title. */
  readonly title = input.required<string>();

  /** Group validity. While the active group is invalid, navigation away is blocked. */
  readonly isValid = input(true);

  /** Business-level visibility (e.g. hide for synthetic instruments). */
  readonly isVisible = input(true);

  /** Device restriction; combined with `isVisible` into `effectiveVisible`. */
  readonly device = input<SettingsDeviceVisibility>(SettingsDeviceVisibility.All);

  private readonly isMobile = toSignal(
    inject(DeviceService).deviceInfo$.pipe(map(info => info.isMobile)),
    {initialValue: false}
  );

  readonly effectiveVisible = computed(() => this.isVisible() && SettingsDeviceVisibilityHelper.matches(this.device(), this.isMobile()));
}

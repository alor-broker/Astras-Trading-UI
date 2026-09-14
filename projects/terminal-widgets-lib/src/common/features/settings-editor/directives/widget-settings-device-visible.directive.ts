import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';
import {SettingsDeviceVisibilityHelper} from '@terminal-widgets-lib/common/features/settings-editor/utils/widget-settings-visibility.helper';

/**
 * Structural directive that renders its content only on devices matching the
 * provided visibility rule. Unifies device-based hiding of individual settings
 * fields with the group-level `device` input, replacing ad-hoc `@if (isMobile)`.
 *
 * Usage: `<ats-widget-settings-switch *atsSettingsDeviceVisible="SettingsDeviceVisibility.DesktopOnly">`
 */
@Directive({
  selector: '[atsSettingsDeviceVisible]'
})
export class SettingsDeviceVisible {
  readonly atsSettingsDeviceVisible = input.required<SettingsDeviceVisibility>();

  private readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  private readonly viewContainer = inject(ViewContainerRef);

  private readonly isMobile = toSignal(
    inject(DeviceService).deviceInfo$.pipe(map(info => info.isMobile)),
    {initialValue: false}
  );

  private hasView = false;

  constructor() {
    effect(() => {
      const visible = SettingsDeviceVisibilityHelper.matches(this.atsSettingsDeviceVisible(), this.isMobile());

      if (visible && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!visible && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}

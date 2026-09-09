import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {WidgetSettingsPlaceholder} from './widget-settings-placeholder/widget-settings-placeholder';

@Component({
  selector: 'ats-widget-skeleton',
  imports: [
    NgTemplateOutlet,
    WidgetSettingsPlaceholder
  ],
  templateUrl: './widget-skeleton.html',
  styleUrl: './widget-skeleton.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ats-widget-settings-active]': 'isSettingsActive()'
  }
})
export class WidgetSkeleton {
  readonly header = input.required<TemplateRef<unknown>>();

  readonly content = input.required<TemplateRef<unknown>>();

  /** Settings editor template instantiated while settings are open. */
  readonly settingsEditorContent = input<TemplateRef<unknown> | null>(null);

  /** @deprecated Legacy inline settings fallback for widgets not yet migrated to the editor. */
  readonly settings = input<TemplateRef<unknown> | null>();

  readonly showSettings = model(false);

  /** Replace regular desktop content with a placeholder while settings are open. */
  readonly showPlaceholder = input(false);

  readonly isBlockWidget = input.required<boolean>();

  readonly showContentScroll = input(false);

  protected readonly isMobile = toSignal(
    inject(DeviceService).deviceInfo$.pipe(map(info => info.isMobile)),
    {initialValue: false}
  );

  protected readonly shouldHideWidgetContent = computed(() =>
    this.settingsEditorContent() != null
    && this.showSettings()
    && (this.isMobile() || this.showPlaceholder())
  );

  protected readonly isSettingsActive = computed(() =>
    this.settingsEditorContent() != null
    && this.showSettings()
    && !this.isMobile()
  );

  /** Legacy settings template rendered instead of the regular widget content. */
  protected readonly inlineSettings = computed<TemplateRef<unknown> | null>(() =>
    this.settingsEditorContent() == null && this.showSettings()
      ? (this.settings() ?? null)
      : null
  );

  toggleSettings(): void {
    this.showSettings.update(value => !value);
  }

  closeSettings(): void {
    this.showSettings.set(false);
  }
}

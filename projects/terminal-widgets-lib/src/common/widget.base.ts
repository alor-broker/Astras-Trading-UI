import {
  Component,
  inject,
  input,
  InputSignal,
  OnInit,
  signal
} from '@angular/core';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {WidgetBadgeHelper} from '@terminal-widgets-lib/common/utils/widget-badge.helper';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {Observable} from 'rxjs';
import {WidgetInstance} from "@terminal-core-lib/features/dashboard/types/dashboard-item.types";

export interface Widget {
  readonly widgetInstance: InputSignal<WidgetInstance>;
  readonly isBlockWidget: InputSignal<boolean>;
  readonly isActive: InputSignal<boolean>;
}

@Component({
  template: ''
})
export abstract class WidgetBase<T extends WidgetSettings> implements Widget, OnInit {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  readonly isActive = input(false);

  protected readonly widgetSettingsService = inject(WidgetSettingsService);

  protected settings$!: Observable<T>;

  protected readonly showSettings = signal(false);

  protected showBadge$!: Observable<boolean>;

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  protected get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    this.createSettingsIfMissing();
    this.settings$ = this.widgetSettingsService.getSettings<T>(this.guid);
    this.showBadge$ = WidgetBadgeHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }

  protected abstract createSettingsIfMissing(): void;

  protected toggleSettings(): void {
    this.showSettings.set(!this.showSettings());
  }
}

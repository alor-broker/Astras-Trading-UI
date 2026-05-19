import {
  Component,
  DestroyRef,
  inject,
  input,
  InputSignal,
  OnInit,
  output
} from '@angular/core';
import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {
  Observable,
  shareReplay,
  take
} from "rxjs";
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export interface WidgetSettingsForm {
  guid: InputSignal<string>;
  readonly showCopy: boolean;
  readonly canSave: boolean;
  readonly canCopy: boolean;

  updateSettings(): void;

  createWidgetCopy(): void;
}

@Component({
  template: ''
})
export abstract class WidgetSettingsBase<T extends WidgetSettings> implements WidgetSettingsForm, OnInit {
  readonly settingsChange = output();

  readonly guid = input.required<string>();

  protected abstract settings$: Observable<T>;

  protected readonly settingsService = inject(WidgetSettingsService);

  protected readonly manageDashboardsService = inject(DesktopManageDashboardsService, {optional: true});

  protected readonly destroyRef = inject(DestroyRef);

  get showCopy(): boolean {
    return this.manageDashboardsService != null;
  };

  get canSave(): boolean {
    return true;
  }

  get canCopy(): boolean {
    return this.canSave && this.manageDashboardsService != null;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(settings => {
      this.setCurrentFormValues(settings);
    });
  }

  updateSettings(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      this.settingsService.updateSettings(initialSettings.guid, this.getUpdatedSettings(initialSettings));
      this.settingsChange.emit();
    });
  }

  createWidgetCopy(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      this.manageDashboardsService?.copyWidget(this.getSettingsToCopy(initialSettings));
    });
  }

  protected abstract getUpdatedSettings(initialSettings: T): Partial<T>;

  protected getSettingsToCopy(initialSettings: T): T {
    return {
      ...initialSettings,
      ...this.getUpdatedSettings(initialSettings)
    };
  }

  protected initSettingsStream(): void {
    this.settings$ = this.settingsService.getSettings<T>(this.guid()).pipe(
      shareReplay(1)
    );
  }

  protected abstract setCurrentFormValues(settings: T): void;
}

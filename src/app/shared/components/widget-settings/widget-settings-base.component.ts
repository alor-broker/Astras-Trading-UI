import { WidgetSettings } from "../../models/widget-settings.model";
import {
  Observable,
  shareReplay,
  take
} from "rxjs";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { ManageDashboardsService } from "../../services/manage-dashboards.service";
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
export interface WidgetSettingsFormComponent {
  guid: string;
  readonly showCopy: boolean;
  readonly canSave: boolean;
  readonly canCopy: boolean;
  updateSettings(): void;
  createWidgetCopy(): void;
}

@Component({
  template: ''
})
export abstract class WidgetSettingsBaseComponent<T extends WidgetSettings> implements WidgetSettingsFormComponent, OnInit {
  @Input({ required: true })
  guid!: string;

  @Output()
  settingsChange = new EventEmitter<void>();

  protected abstract settings$: Observable<T>;

  protected constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

  abstract get showCopy(): boolean;

  abstract get canSave(): boolean;

  get canCopy(): boolean {
    return this.canSave;
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
      this.manageDashboardsService.copyWidget(this.getSettingsToCopy(initialSettings));
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
    this.settings$ = this.settingsService.getSettings<T>(this.guid).pipe(
      shareReplay(1)
    );
  }

  protected abstract setCurrentFormValues(settings: T): void;
}

import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  allInstrumentsColumns,
  InstrumentSelectSettings
} from '../../models/instrument-select-settings.model';
import { BaseColumnId } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {
  Observable
} from "rxjs";

@Component({
  selector: 'ats-instrument-select-settings',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent extends WidgetSettingsBaseComponent<InstrumentSelectSettings> implements OnInit {
  settingsForm!: UntypedFormGroup;
  allInstrumentColumns: BaseColumnId[] = allInstrumentsColumns;
  protected settings$!: Observable<InstrumentSelectSettings>;

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.settingsForm?.valid ?? false;
  }

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.buildSettingsForm(settings);
    });
  }

  protected getUpdatedSettings(): Partial<InstrumentSelectSettings> {
    return {
      ...this.settingsForm.value
    };
  }

  private buildSettingsForm(currentSettings: InstrumentSelectSettings) {
    this.settingsForm = new UntypedFormGroup({
      instrumentColumns: new UntypedFormControl(currentSettings.instrumentColumns),
      showFavorites: new UntypedFormControl(currentSettings.showFavorites ?? false)
    });
  }
}

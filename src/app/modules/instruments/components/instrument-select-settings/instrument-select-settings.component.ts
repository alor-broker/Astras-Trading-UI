import { Component, DestroyRef, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { allInstrumentsColumns, InstrumentSelectSettings } from '../../models/instrument-select-settings.model';
import { BaseColumnId } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { Observable } from "rxjs";
import { TimeframeValue } from "../../../light-chart/models/light-chart.models";

@Component({
  selector: 'ats-instrument-select-settings',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent extends WidgetSettingsBaseComponent<InstrumentSelectSettings> implements OnInit {
  settingsForm?: UntypedFormGroup;
  allInstrumentColumns: BaseColumnId[] = allInstrumentsColumns;
  protected settings$!: Observable<InstrumentSelectSettings>;

  readonly priceChangeTimeFrames = [
    { name: 'S1', value: TimeframeValue.S1},
    { name: 'S5', value: TimeframeValue.S5},
    { name: 'S10', value: TimeframeValue.S10},
    { name: 'M1', value: TimeframeValue.M1},
    { name: 'M5', value: TimeframeValue.M5},
    { name: 'M15', value: TimeframeValue.M15},
    { name: 'H', value: TimeframeValue.H},
    { name: 'H4', value: TimeframeValue.H4},
    { name: 'Day', value: TimeframeValue.Day},
    { name: 'W', value: TimeframeValue.W},
    { name: 'Month', value: TimeframeValue.Month}
  ];

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
      ...this.settingsForm!.value
    } as Partial<InstrumentSelectSettings>;
  }

  private buildSettingsForm(currentSettings: InstrumentSelectSettings): void {
    this.settingsForm = new UntypedFormGroup({
      instrumentColumns: new UntypedFormControl(currentSettings.instrumentColumns),
      showFavorites: new UntypedFormControl(currentSettings.showFavorites ?? false),
      priceChangeTimeframe: new UntypedFormControl(currentSettings.priceChangeTimeframe ?? TimeframeValue.Day)
    });
  }
}

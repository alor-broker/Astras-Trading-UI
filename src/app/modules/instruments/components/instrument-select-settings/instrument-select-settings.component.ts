import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {allInstrumentsColumns, InstrumentSelectSettings} from '../../models/instrument-select-settings.model';
import {BaseColumnId, TableDisplaySettings} from "../../../../shared/models/settings/table-settings.model";
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {Observable} from "rxjs";
import {TimeframeValue} from "../../../light-chart/models/light-chart.models";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTabComponent, NzTabsComponent} from 'ng-zorro-antd/tabs';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {RemoveSelectTitlesDirective} from '../../../../shared/directives/remove-select-titles.directive';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {WatchlistCollectionEditComponent} from '../watchlist-collection-edit/watchlist-collection-edit.component';

@Component({
  selector: 'ats-instrument-select-settings',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less'],
  imports: [
    WidgetSettingsComponent,
    TranslocoDirective,
    NzTabsComponent,
    NzTabComponent,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzSelectComponent,
    RemoveSelectTitlesDirective,
    NzOptionComponent,
    NzTooltipDirective,
    NzSwitchComponent,
    WatchlistCollectionEditComponent
  ]
})
export class InstrumentSelectSettingsComponent extends WidgetSettingsBaseComponent<InstrumentSelectSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);

  readonly settingsForm = this.formBuilder.group({
    instrumentColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    showFavorites: this.formBuilder.nonNullable.control(false),
    priceChangeTimeframe: this.formBuilder.nonNullable.control(TimeframeValue.Day)
  });

  allInstrumentColumns: BaseColumnId[] = allInstrumentsColumns;
  readonly priceChangeTimeFrames = [
    {name: 'S1', value: TimeframeValue.S1},
    {name: 'S5', value: TimeframeValue.S5},
    {name: 'S10', value: TimeframeValue.S10},
    {name: 'M1', value: TimeframeValue.M1},
    {name: 'M5', value: TimeframeValue.M5},
    {name: 'M15', value: TimeframeValue.M15},
    {name: 'H', value: TimeframeValue.H},
    {name: 'H4', value: TimeframeValue.H4},
    {name: 'Day', value: TimeframeValue.Day},
    {name: 'W', value: TimeframeValue.W},
    {name: 'Month', value: TimeframeValue.Month}
  ];

  protected settings$!: Observable<InstrumentSelectSettings>;

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const manageDashboardsService = inject(ManageDashboardsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, manageDashboardsService, destroyRef);

    this.settingsService = settingsService;
    this.manageDashboardsService = manageDashboardsService;
    this.destroyRef = destroyRef;
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.settingsForm.valid;
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getUpdatedSettings(initialSetting: InstrumentSelectSettings): Partial<InstrumentSelectSettings> {
    const newSettings = {
      ...this.settingsForm!.value
    } as Partial<InstrumentSelectSettings>;

    newSettings.instrumentTable = this.updateTableSettings(newSettings.instrumentColumns ?? [], initialSetting.instrumentTable);
    delete newSettings.instrumentColumns;

    return newSettings;
  }

  protected setCurrentFormValues(settings: InstrumentSelectSettings): void {
    this.settingsForm.reset();

    this.settingsForm.controls.instrumentColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.instrumentTable,
        settings.instrumentColumns ?? []
      )?.columns.map(c => c.columnId) ?? []
    );

    this.settingsForm.controls.showFavorites.setValue(settings.showFavorites ?? false);
    this.settingsForm.controls.priceChangeTimeframe.setValue(settings.priceChangeTimeframe ?? TimeframeValue.Day);
  }

  private updateTableSettings(columnIds: string[], currentSettings?: TableDisplaySettings): TableDisplaySettings {
    const newSettings = TableSettingHelper.toTableDisplaySettings(null, columnIds)!;

    if (currentSettings) {
      newSettings.columns.forEach((column, index) => {
        const matchedColumn = currentSettings!.columns.find(x => x.columnId === column.columnId);
        if (matchedColumn) {
          newSettings.columns[index] = {
            ...column,
            ...matchedColumn
          };
        }
      });
    }

    return newSettings!;
  }
}

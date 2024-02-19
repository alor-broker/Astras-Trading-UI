import { Component, DestroyRef, OnInit } from '@angular/core';
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { bondScreenerColumns, BondScreenerSettings } from "../../models/bond-screener-settings.model";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { BaseColumnId, TableDisplaySettings } from "../../../../shared/models/settings/table-settings.model";
import { Observable } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

@Component({
  selector: 'ats-bond-screener-settings',
  templateUrl: './bond-screener-settings.component.html',
  styleUrls: ['./bond-screener-settings.component.less']
})
export class BondScreenerSettingsComponent extends WidgetSettingsBaseComponent<BondScreenerSettings> implements OnInit {
  form?: UntypedFormGroup;
  bondScreenerColumns: BaseColumnId[] = bondScreenerColumns;

  protected settings$!: Observable<BondScreenerSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return false;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        bondScreenerColumns: new UntypedFormControl(
          TableSettingHelper.toTableDisplaySettings(
            settings.bondScreenerTable,
            bondScreenerColumns.filter(c => c.isDefault).map(x => x.id)
          )?.columns.map(c => c.columnId),
          Validators.required
        ),
      });
    });
  }

  protected getUpdatedSettings(initialSettings: BondScreenerSettings): Partial<BondScreenerSettings> {
    const newSettings = {
      ...this.form!.value,
    } as Partial<BondScreenerSettings & { bondScreenerColumns: string[]}>;

    newSettings.bondScreenerTable = this.updateTableSettings(newSettings.bondScreenerColumns ?? [], initialSettings.bondScreenerTable);
    delete newSettings.bondScreenerColumns;

    return newSettings;
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

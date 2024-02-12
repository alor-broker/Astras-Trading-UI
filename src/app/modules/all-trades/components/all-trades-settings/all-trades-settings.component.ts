import { Component, DestroyRef, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AllTradesSettings,
  allTradesWidgetColumns
} from '../../models/all-trades-settings.model';
import { BaseColumnId, TableDisplaySettings } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { Observable } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";

@Component({
  selector: 'ats-all-trades-settings',
  templateUrl: './all-trades-settings.component.html',
  styleUrls: ['./all-trades-settings.component.less']
})
export class AllTradesSettingsComponent extends WidgetSettingsBaseComponent<AllTradesSettings> implements OnInit {
  form?: UntypedFormGroup;
  allTradesColumns: BaseColumnId[] = allTradesWidgetColumns;

  protected settings$!: Observable<AllTradesSettings>;
  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        allTradesColumns: new UntypedFormControl(
          TableSettingHelper.toTableDisplaySettings(settings.allTradesTable, settings.allTradesColumns ?? [])?.columns.map(c => c.columnId),
          Validators.required
        ),
        highlightRowsBySide: new UntypedFormControl(settings.highlightRowsBySide ?? false, Validators.required)
      });
    });
  }

  protected getUpdatedSettings(initialSettings: AllTradesSettings): Partial<AllTradesSettings> {
    const newSettings = {
      ...this.form!.value,
    } as Partial<AllTradesSettings>;

    newSettings.allTradesTable = this.updateTableSettings(newSettings.allTradesColumns ?? [], initialSettings.allTradesTable);
    delete newSettings.allTradesColumns;

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

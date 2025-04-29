import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AllTradesSettings,
  allTradesWidgetColumns
} from '../../models/all-trades-settings.model';
import {
  BaseColumnId,
  TableDisplaySettings
} from "../../../../shared/models/settings/table-settings.model";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { Observable } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";

@Component({
    selector: 'ats-all-trades-settings',
    templateUrl: './all-trades-settings.component.html',
    styleUrls: ['./all-trades-settings.component.less'],
    standalone: false
})
export class AllTradesSettingsComponent extends WidgetSettingsBaseComponent<AllTradesSettings> implements OnInit {
  readonly form = this.formBuilder.group({
    allTradesColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    highlightRowsBySide: this.formBuilder.nonNullable.control(false)
  });

  allTradesColumns: BaseColumnId[] = allTradesWidgetColumns;

  protected settings$!: Observable<AllTradesSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder,
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getUpdatedSettings(initialSettings: AllTradesSettings): Partial<AllTradesSettings> {
    const newSettings = {
      ...this.form.value,
    } as Partial<AllTradesSettings>;

    newSettings.allTradesTable = this.updateTableSettings(newSettings.allTradesColumns ?? [], initialSettings.allTradesTable);
    delete newSettings.allTradesColumns;

    return newSettings;
  }

  protected setCurrentFormValues(settings: AllTradesSettings): void {
    this.form.reset();

    this.form.controls.allTradesColumns.setValue(TableSettingHelper.toTableDisplaySettings(
      settings.allTradesTable,
      settings.allTradesColumns ?? []
    )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.highlightRowsBySide.setValue(settings.highlightRowsBySide ?? false);
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

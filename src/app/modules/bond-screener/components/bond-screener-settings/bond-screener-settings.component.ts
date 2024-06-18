import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {
  bondScreenerColumns,
  BondScreenerSettings
} from "../../models/bond-screener-settings.model";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import {
  BaseColumnId,
  TableDisplaySettings
} from "../../../../shared/models/settings/table-settings.model";
import { Observable } from "rxjs";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

@Component({
  selector: 'ats-bond-screener-settings',
  templateUrl: './bond-screener-settings.component.html',
  styleUrls: ['./bond-screener-settings.component.less']
})
export class BondScreenerSettingsComponent extends WidgetSettingsBaseComponent<BondScreenerSettings> implements OnInit {
  readonly form = this.formBuilder.group({
    bondScreenerColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    hideExpired: this.formBuilder.nonNullable.control(true)
  });

  bondScreenerColumns: BaseColumnId[] = bondScreenerColumns;

  protected settings$!: Observable<BondScreenerSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
  }

  get showCopy(): boolean {
    return false;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getUpdatedSettings(initialSettings: BondScreenerSettings): Partial<BondScreenerSettings> {
    const newSettings = {
      ...this.form!.value,
    } as Partial<BondScreenerSettings & { bondScreenerColumns: string[] }>;

    newSettings.bondScreenerTable = this.updateTableSettings(newSettings.bondScreenerColumns ?? [], initialSettings.bondScreenerTable);
    delete newSettings.bondScreenerColumns;

    return newSettings;
  }

  protected setCurrentFormValues(settings: BondScreenerSettings): void {
    this.form.reset();

    this.form.controls.bondScreenerColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.bondScreenerTable,
        bondScreenerColumns.filter(c => c.isDefault).map(x => x.id)
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.hideExpired.setValue(settings.hideExpired ?? true);
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

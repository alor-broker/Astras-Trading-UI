import {
  Component,
  DestroyRef,
  OnInit,
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  allInstrumentsColumns,
  AllInstrumentsSettings
} from '../../model/all-instruments-settings.model';
import { BaseColumnId, TableDisplaySettings } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { Observable } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";

@Component({
  selector: 'ats-all-instruments-settings',
  templateUrl: './all-instruments-settings.component.html',
  styleUrls: ['./all-instruments-settings.component.less']
})
export class AllInstrumentsSettingsComponent extends WidgetSettingsBaseComponent<AllInstrumentsSettings> implements OnInit {
  form?: UntypedFormGroup;
  allInstrumentsColumns: BaseColumnId[] = allInstrumentsColumns;

  protected settings$!: Observable<AllInstrumentsSettings>;

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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        allInstrumentsColumns: new UntypedFormControl(
          TableSettingHelper.toTableDisplaySettings(settings.allInstrumentsTable, settings.allInstrumentsColumns ?? [])?.columns.map(c => c.columnId),
          Validators.required
        ),
      });
    });
  }

  protected getUpdatedSettings(initialSettings: AllInstrumentsSettings): Partial<AllInstrumentsSettings> {
    const newSettings = {
      ...this.form!.value,
    } as Partial<AllInstrumentsSettings>;

    newSettings.allInstrumentsTable = this.updateTableSettings(newSettings.allInstrumentsColumns ?? [], initialSettings.allInstrumentsTable);
    delete newSettings.allInstrumentsColumns;

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

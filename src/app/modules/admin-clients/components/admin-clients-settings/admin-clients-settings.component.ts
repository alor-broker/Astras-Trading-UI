import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {
  AdminClientsSettings,
  AdminClientsTableColumns
} from "../../models/admin-clients-settings.model";
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  BaseColumnId,
  ColumnDisplaySettings,
  TableDisplaySettings
} from "../../../../shared/models/settings/table-settings.model";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
import {
  NzColDirective,
  NzRowDirective
} from "ng-zorro-antd/grid";
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from "ng-zorro-antd/form";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import { SharedModule } from "../../../../shared/shared.module";
import { TranslocoDirective } from "@jsverse/transloco";
import { WidgetSettingsComponent } from "../../../../shared/components/widget-settings/widget-settings.component";

@Component({
  selector: 'ats-admin-clients-settings',
  imports: [
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzOptionComponent,
    NzRowDirective,
    NzSelectComponent,
    ReactiveFormsModule,
    SharedModule,
    TranslocoDirective,
    WidgetSettingsComponent,
    NzSliderComponent
  ],
  templateUrl: './admin-clients-settings.component.html',
  styleUrl: './admin-clients-settings.component.less'
})
export class AdminClientsSettingsComponent extends WidgetSettingsBaseComponent<AdminClientsSettings> implements OnInit {
  readonly validation = {
    refreshIntervalSec: {
      min: 30,
      max: 300
    }
  };

  readonly marks: NzMarks = {
    [this.validation.refreshIntervalSec.min]: this.validation.refreshIntervalSec.min.toString(),
    [this.validation.refreshIntervalSec.max]: this.validation.refreshIntervalSec.max.toString(),
  };

  readonly form = this.formBuilder.group({
    tableColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    refreshIntervalSec: this.formBuilder.nonNullable.control<number>(
      60,
      {
        validators: [
          Validators.required,
          Validators.min(this.validation.refreshIntervalSec.min),
          Validators.max(this.validation.refreshIntervalSec.max)
        ]
      }
    )
  });

  allColumns: BaseColumnId[] = AdminClientsTableColumns;

  protected settings$!: Observable<AdminClientsSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  protected getUpdatedSettings(initialSettings: AdminClientsSettings): Partial<AdminClientsSettings> {
    const formValue = this.form.value;
    const newSettings: Partial<AdminClientsSettings> = {
      refreshIntervalSec: formValue.refreshIntervalSec ?? 60
    };

    newSettings.table = this.updateTableSettings(formValue.tableColumns ?? [], initialSettings.table);

    return newSettings;
  }

  protected setCurrentFormValues(settings: AdminClientsSettings): void {
    this.form.reset();

    this.form.controls.refreshIntervalSec.setValue(settings.refreshIntervalSec ?? 60);
    this.form.controls.tableColumns.setValue(settings.table.columns.map(c => c.columnId) ?? []
    );
  }

  private updateTableSettings(columnIds: string[], currentSettings?: TableDisplaySettings): TableDisplaySettings {
    const newSettings = {
      columns: columnIds.map(x => ({
        columnId: x,
        columnWidth: null
      } as ColumnDisplaySettings))
    };

    if (currentSettings) {
      columnIds.forEach((column, index) => {
        const matchedColumn = currentSettings!.columns.find(x => x.columnId === column);
        if (matchedColumn) {
          newSettings.columns[index] = {
            ...matchedColumn
          };
        }
      });
    }

    return newSettings!;
  }
}

import {
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';
import {WidgetSettingsBaseComponent} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
import {
  BaseColumnId,
  ColumnDisplaySettings,
  TableDisplaySettings
} from "../../../../shared/models/settings/table-settings.model";
import {Observable} from "rxjs";
import {
  AdminClientPositionsSettings,
  AdminClientPositionsTableColumns
} from "../../models/admin-client-positions-settings.model";
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
import {TranslocoDirective} from "@jsverse/transloco";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";

@Component({
  selector: 'ats-admin-client-positions-settings',
  imports: [
    FormsModule,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzOptionComponent,
    NzRowDirective,
    NzSelectComponent,
    NzSliderComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    WidgetSettingsComponent
  ],
  templateUrl: './admin-client-positions-settings.component.html',
  styleUrl: './admin-client-positions-settings.component.less',
})
export class AdminClientPositionsSettingsComponent extends WidgetSettingsBaseComponent<AdminClientPositionsSettings> implements OnInit {
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

  allColumns: BaseColumnId[] = AdminClientPositionsTableColumns;

  protected readonly settingsService: WidgetSettingsService;

  protected readonly manageDashboardsService: ManageDashboardsService;

  protected readonly destroyRef: DestroyRef;

  protected settings$!: Observable<AdminClientPositionsSettings>;

  private readonly formBuilder = inject(FormBuilder);

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
    return this.form.valid;
  }

  protected getUpdatedSettings(initialSettings: AdminClientPositionsSettings): Partial<AdminClientPositionsSettings> {
    const formValue = this.form.value;
    const newSettings: Partial<AdminClientPositionsSettings> = {
      refreshIntervalSec: formValue.refreshIntervalSec ?? 60
    };

    newSettings.table = this.updateTableSettings(formValue.tableColumns ?? [], initialSettings.table);

    return newSettings;
  }

  protected setCurrentFormValues(settings: AdminClientPositionsSettings): void {
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

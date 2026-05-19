import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
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
import {TranslocoDirective} from "@jsverse/transloco";
import {
  AdminClientsTableColumns,
  AdminClientsWidgetSettings
} from '@terminal-widgets-lib/widgets/admin-clients/widgets-settings.types';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  BaseColumnId,
  ColumnDisplaySettings,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';

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
    TranslocoDirective,
    NzSliderComponent,
    WidgetSettings
  ],
  templateUrl: './admin-clients-settings.html',
  styleUrl: './admin-clients-settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AdminClientsSettings extends WidgetSettingsBase<AdminClientsWidgetSettings> implements OnInit {
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

  allColumns: BaseColumnId[] = AdminClientsTableColumns;

  protected settings$!: Observable<AdminClientsWidgetSettings>;

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

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected getUpdatedSettings(initialSettings: AdminClientsWidgetSettings): Partial<AdminClientsWidgetSettings> {
    const formValue = this.form.value;
    const newSettings: Partial<AdminClientsWidgetSettings> = {
      refreshIntervalSec: formValue.refreshIntervalSec ?? 60
    };

    newSettings.table = this.updateTableSettings(formValue.tableColumns ?? [], initialSettings.table);

    return newSettings;
  }

  protected setCurrentFormValues(settings: AdminClientsWidgetSettings): void {
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

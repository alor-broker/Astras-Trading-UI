import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
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
import {Observable} from "rxjs";
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
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  AdminClientPositionsTableColumns,
  AdminClientPositionsWidgetSettings
} from '@terminal-widgets-lib/widgets/admin-client-positions/widget-settings.types';
import {
  BaseColumnId,
  ColumnDisplaySettings,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';

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
    WidgetSettings
  ],
  templateUrl: './admin-client-positions-settings.html',
  styleUrl: './admin-client-positions-settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AdminClientPositionsSettings extends WidgetSettingsBase<AdminClientPositionsWidgetSettings> implements OnInit {
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

  protected settings$!: Observable<AdminClientPositionsWidgetSettings>;

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

  protected getUpdatedSettings(initialSettings: AdminClientPositionsWidgetSettings): Partial<AdminClientPositionsWidgetSettings> {
    const formValue = this.form.value;
    const newSettings: Partial<AdminClientPositionsWidgetSettings> = {
      refreshIntervalSec: formValue.refreshIntervalSec ?? 60
    };

    newSettings.table = this.updateTableSettings(formValue.tableColumns ?? [], initialSettings.table);

    return newSettings;
  }

  protected setCurrentFormValues(settings: AdminClientPositionsWidgetSettings): void {
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

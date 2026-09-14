import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {Observable} from "rxjs";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {
  allInstrumentsColumns,
  AllInstrumentsWidgetSettings
} from '@terminal-widgets-lib/widgets/all-instruments/widget-settings.types';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  BaseColumnId,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';

@Component({
  selector: 'ats-all-instruments-settings',
  templateUrl: './all-instruments-settings.html',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzSelectComponent,
    NzOptionComponent,
    WidgetSettingsEditor,
    WidgetSettingsForm,
    WidgetSettingsFormItem
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AllInstrumentsSettings extends WidgetSettingsBase<AllInstrumentsWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly allInstrumentsColumns: BaseColumnId[] = allInstrumentsColumns;

  protected settings$!: Observable<AllInstrumentsWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    allInstrumentsColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected getUpdatedSettings(initialSettings: AllInstrumentsWidgetSettings): Partial<AllInstrumentsWidgetSettings> {
    return {
      allInstrumentsTable: this.updateTableSettings(
        this.form.controls.allInstrumentsColumns.value,
        initialSettings.allInstrumentsTable
      )
    };
  }

  protected setCurrentFormValues(settings: AllInstrumentsWidgetSettings): void {
    this.form.reset();

    this.form.controls.allInstrumentsColumns.setValue(TableSettingHelper.toTableDisplaySettings(
      settings.allInstrumentsTable,
      settings.allInstrumentsColumns ?? []
    )?.columns.map(c => c.columnId) ?? []
    );
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

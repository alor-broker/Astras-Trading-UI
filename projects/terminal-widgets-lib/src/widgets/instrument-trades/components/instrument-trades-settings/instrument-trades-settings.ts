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
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  BaseColumnId,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {
  instrumentTradesWidgetColumns,
  InstrumentTradesWidgetSettings
} from '@terminal-widgets-lib/widgets/instrument-trades/widget-settings.types';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';

@Component({
  selector: 'ats-instrument-trades-settings',
  templateUrl: './instrument-trades-settings.html',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzSelectComponent,
    NzOptionComponent,
    WidgetSettingsEditor,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    WidgetSettingsSwitch
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InstrumentTradesSettings extends WidgetSettingsBase<InstrumentTradesWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  allTradesColumns: BaseColumnId[] = instrumentTradesWidgetColumns;

  protected settings$!: Observable<InstrumentTradesWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    allTradesColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    highlightRowsBySide: this.formBuilder.nonNullable.control(false)
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected getUpdatedSettings(initialSettings: InstrumentTradesWidgetSettings): Partial<InstrumentTradesWidgetSettings> {
    const formValue = this.form.getRawValue();

    return {
      allTradesTable: this.updateTableSettings(formValue.allTradesColumns, initialSettings.allTradesTable),
      highlightRowsBySide: formValue.highlightRowsBySide
    };
  }

  protected setCurrentFormValues(settings: InstrumentTradesWidgetSettings): void {
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

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
  bondScreenerColumns,
  BondScreenerWidgetSettings
} from '@terminal-widgets-lib/widgets/bond-screener/widget-settings.types';
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
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';

@Component({
  selector: 'ats-bond-screener-settings',
  templateUrl: './bond-screener-settings.html',
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
export class BondScreenerSettings extends WidgetSettingsBase<BondScreenerWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly bondScreenerColumns: BaseColumnId[] = bondScreenerColumns;

  protected override settings$!: Observable<BondScreenerWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    bondScreenerColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    hideExpired: this.formBuilder.nonNullable.control(true)
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected getUpdatedSettings(initialSettings: BondScreenerWidgetSettings): Partial<BondScreenerWidgetSettings> {
    const {bondScreenerColumns, hideExpired} = this.form.getRawValue();

    return {
      bondScreenerTable: this.updateTableSettings(bondScreenerColumns, initialSettings.bondScreenerTable),
      hideExpired
    };
  }

  protected setCurrentFormValues(settings: BondScreenerWidgetSettings): void {
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

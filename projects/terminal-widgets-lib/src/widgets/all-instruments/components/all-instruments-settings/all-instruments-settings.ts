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
import {Observable} from "rxjs";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
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
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';

@Component({
  selector: 'ats-all-instruments-settings',
  templateUrl: './all-instruments-settings.html',
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzSelectComponent,
    NzOptionComponent,
    WidgetSettings
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AllInstrumentsSettings extends WidgetSettingsBase<AllInstrumentsWidgetSettings> implements OnInit {
  allInstrumentsColumns: BaseColumnId[] = allInstrumentsColumns;

  protected settings$!: Observable<AllInstrumentsWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    allInstrumentsColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
  });

  override get canSave(): boolean {
    return this.form.valid;
  }


  protected getUpdatedSettings(initialSettings: AllInstrumentsWidgetSettings): Partial<AllInstrumentsWidgetSettings> {
    const newSettings = {
      ...this.form.value,
    } as Partial<AllInstrumentsWidgetSettings>;

    newSettings.allInstrumentsTable = this.updateTableSettings(newSettings.allInstrumentsColumns ?? [], initialSettings.allInstrumentsTable);
    delete newSettings.allInstrumentsColumns;

    return newSettings;
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

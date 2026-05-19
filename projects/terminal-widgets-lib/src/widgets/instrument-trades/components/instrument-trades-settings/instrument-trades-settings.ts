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
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
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
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';

@Component({
  selector: 'ats-instrument-trades-settings',
  templateUrl: './instrument-trades-settings.html',
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
    NzSwitchComponent,
    WidgetSettings
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InstrumentTradesSettings extends WidgetSettingsBase<InstrumentTradesWidgetSettings> implements OnInit {
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
    const newSettings = {
      ...this.form.value,
    } as Partial<InstrumentTradesWidgetSettings>;

    newSettings.allTradesTable = this.updateTableSettings(newSettings.allTradesColumns ?? [], initialSettings.allTradesTable);
    delete newSettings.allTradesColumns;

    return newSettings;
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

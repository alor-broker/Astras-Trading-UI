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
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';

@Component({
  selector: 'ats-bond-screener-settings',
  templateUrl: './bond-screener-settings.html',
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
export class BondScreenerSettings extends WidgetSettingsBase<BondScreenerWidgetSettings> implements OnInit {
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
    const newSettings = {
      ...this.form!.value,
    } as Partial<BondScreenerWidgetSettings & { bondScreenerColumns: string[] }>;

    newSettings.bondScreenerTable = this.updateTableSettings(newSettings.bondScreenerColumns ?? [], initialSettings.bondScreenerTable);
    delete newSettings.bondScreenerColumns;

    return newSettings;
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

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  allInstrumentsColumns,
  AllInstrumentsSettings
} from '../../model/all-instruments-settings.model';
import {
  BaseColumnId,
  TableDisplaySettings
} from "../../../../shared/models/settings/table-settings.model";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { Observable } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { WidgetSettingsComponent } from '../../../../shared/components/widget-settings/widget-settings.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzFormDirective, NzFormItemComponent, NzFormControlComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzRowDirective, NzColDirective } from 'ng-zorro-antd/grid';
import { NzSelectComponent, NzOptionComponent } from 'ng-zorro-antd/select';

@Component({
    selector: 'ats-all-instruments-settings',
    templateUrl: './all-instruments-settings.component.html',
    styleUrls: ['./all-instruments-settings.component.less'],
    imports: [
      WidgetSettingsComponent,
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
      NzOptionComponent
    ]
})
export class AllInstrumentsSettingsComponent extends WidgetSettingsBaseComponent<AllInstrumentsSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    allInstrumentsColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
  });

  allInstrumentsColumns: BaseColumnId[] = allInstrumentsColumns;

  protected settings$!: Observable<AllInstrumentsSettings>;

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

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getUpdatedSettings(initialSettings: AllInstrumentsSettings): Partial<AllInstrumentsSettings> {
    const newSettings = {
      ...this.form.value,
    } as Partial<AllInstrumentsSettings>;

    newSettings.allInstrumentsTable = this.updateTableSettings(newSettings.allInstrumentsColumns ?? [], initialSettings.allInstrumentsTable);
    delete newSettings.allInstrumentsColumns;

    return newSettings;
  }

  protected setCurrentFormValues(settings: AllInstrumentsSettings): void {
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

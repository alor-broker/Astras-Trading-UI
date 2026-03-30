import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AllTradesSettings,
  allTradesWidgetColumns
} from '../../models/all-trades-settings.model';
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
import { NzSwitchComponent } from 'ng-zorro-antd/switch';

@Component({
    selector: 'ats-all-trades-settings',
    templateUrl: './all-trades-settings.component.html',
    styleUrls: ['./all-trades-settings.component.less'],
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
      NzOptionComponent,
      NzSwitchComponent
    ]
})
export class AllTradesSettingsComponent extends WidgetSettingsBaseComponent<AllTradesSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    allTradesColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    highlightRowsBySide: this.formBuilder.nonNullable.control(false)
  });

  allTradesColumns: BaseColumnId[] = allTradesWidgetColumns;

  protected settings$!: Observable<AllTradesSettings>;

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

  protected getUpdatedSettings(initialSettings: AllTradesSettings): Partial<AllTradesSettings> {
    const newSettings = {
      ...this.form.value,
    } as Partial<AllTradesSettings>;

    newSettings.allTradesTable = this.updateTableSettings(newSettings.allTradesColumns ?? [], initialSettings.allTradesTable);
    delete newSettings.allTradesColumns;

    return newSettings;
  }

  protected setCurrentFormValues(settings: AllTradesSettings): void {
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

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {bondScreenerColumns, BondScreenerSettings} from "../../models/bond-screener-settings.model";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {BaseColumnId, TableDisplaySettings} from "../../../../shared/models/settings/table-settings.model";
import {Observable} from "rxjs";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';

@Component({
  selector: 'ats-bond-screener-settings',
  templateUrl: './bond-screener-settings.component.html',
  styleUrls: ['./bond-screener-settings.component.less'],
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
export class BondScreenerSettingsComponent extends WidgetSettingsBaseComponent<BondScreenerSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    bondScreenerColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    hideExpired: this.formBuilder.nonNullable.control(true)
  });

  bondScreenerColumns: BaseColumnId[] = bondScreenerColumns;

  protected settings$!: Observable<BondScreenerSettings>;

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
    return false;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getUpdatedSettings(initialSettings: BondScreenerSettings): Partial<BondScreenerSettings> {
    const newSettings = {
      ...this.form!.value,
    } as Partial<BondScreenerSettings & { bondScreenerColumns: string[] }>;

    newSettings.bondScreenerTable = this.updateTableSettings(newSettings.bondScreenerColumns ?? [], initialSettings.bondScreenerTable);
    delete newSettings.bondScreenerColumns;

    return newSettings;
  }

  protected setCurrentFormValues(settings: BondScreenerSettings): void {
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

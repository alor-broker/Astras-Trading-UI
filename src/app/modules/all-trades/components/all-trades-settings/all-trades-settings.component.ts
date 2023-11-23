import { Component, DestroyRef, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AllTradesSettings,
  allTradesWidgetColumns
} from '../../models/all-trades-settings.model';
import { BaseColumnId } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { Observable } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TechChartSettings } from "../../../tech-chart/models/tech-chart-settings.model";

@Component({
  selector: 'ats-all-trades-settings',
  templateUrl: './all-trades-settings.component.html',
  styleUrls: ['./all-trades-settings.component.less']
})
export class AllTradesSettingsComponent extends WidgetSettingsBaseComponent<AllTradesSettings> implements OnInit {
  form?: UntypedFormGroup;
  allTradesColumns: BaseColumnId[] = allTradesWidgetColumns;

  protected settings$!: Observable<AllTradesSettings>;
  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        allTradesColumns: new UntypedFormControl(settings.allTradesColumns, Validators.required),
        highlightRowsBySide: new UntypedFormControl(settings.highlightRowsBySide ?? false, Validators.required)
      });
    });
  }

  protected getUpdatedSettings(): Partial<TechChartSettings> {
    return {
      ...this.form!.value,
    } as Partial<TechChartSettings>;
  }
}

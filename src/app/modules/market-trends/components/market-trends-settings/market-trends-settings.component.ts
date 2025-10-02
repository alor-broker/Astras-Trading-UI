import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { MarketTrendsSettings } from "../../models/market-trends-settings.model";

import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
import {
  ExtendedFilter,
  MarketSector
} from "../../../../shared/models/market-typings.model";
import {
  NzColDirective,
  NzRowDirective
} from "ng-zorro-antd/grid";
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from "ng-zorro-antd/form";
import { SharedModule } from "../../../../shared/shared.module";
import { TranslocoDirective } from "@jsverse/transloco";
import { WidgetSettingsComponent } from "../../../../shared/components/widget-settings/widget-settings.component";

@Component({
  selector: 'ats-market-trends-settings',
  imports: [
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzRowDirective,
    NzSliderComponent,
    ReactiveFormsModule,
    SharedModule,
    TranslocoDirective,
    WidgetSettingsComponent
  ],
  templateUrl: './market-trends-settings.component.html',
  styleUrl: './market-trends-settings.component.less'
})
export class MarketTrendsSettingsComponent extends WidgetSettingsBaseComponent<MarketTrendsSettings> implements OnInit {
  readonly validation = {
    itemsCount: {
      min: 5,
      max: 100
    }
  };

  readonly marks: NzMarks = {
    [this.validation.itemsCount.min]: this.validation.itemsCount.min.toString(),
    [this.validation.itemsCount.max]: this.validation.itemsCount.max.toString(),
  };

  protected readonly form = this.formBuilder.group({
    itemsCount: this.formBuilder.nonNullable.control(
      20,
      {
        validators: [
          Validators.required,
          Validators.min(this.validation.itemsCount.min),
          Validators.max(this.validation.itemsCount.max)
        ]
      }
    ),
    displaySectors: this.formBuilder.nonNullable.control<MarketSector[]>([]),
    extendedFilter: this.formBuilder.nonNullable.control<ExtendedFilter[]>([])
  });

  protected settings$!: Observable<MarketTrendsSettings>;

  protected readonly allSectors = Object.keys(MarketSector)
    .map(s => MarketSector[s as keyof typeof MarketSector]);

  protected readonly allExtendedFilters = Object.keys(ExtendedFilter)
    .map(s => ExtendedFilter[s as keyof typeof ExtendedFilter]);

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
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

  protected getUpdatedSettings(initialSettings: MarketTrendsSettings): Partial<MarketTrendsSettings> {
    const formValue = this.form.value;

    return {
      ...initialSettings,
      itemsCount: formValue.itemsCount ?? 20,
      displaySectors: formValue.displaySectors ?? [],
      extendedFilter: formValue.extendedFilter ?? [],
    };
  }

  protected setCurrentFormValues(settings: MarketTrendsSettings): void {
    this.form.reset();

    this.form.controls.itemsCount.setValue(settings.itemsCount);
    this.form.controls.displaySectors.setValue(settings.displaySectors);
    this.form.controls.extendedFilter.setValue(settings.extendedFilter);
  }
}

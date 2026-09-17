import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
import {TranslocoDirective} from "@jsverse/transloco";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import {AsyncPipe} from "@angular/common";
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {MarketTrendsWidgetSettings} from '@terminal-widgets-lib/widgets/market-trends/widget-settings.types';
import {
  ExtendedFilter,
  MarketSector
} from '@terminal-widgets-lib/widgets/market-trends/types/market-trends.types';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';

@Component({
  selector: 'ats-market-trends-settings',
  imports: [
    NzSliderComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    NzSelectComponent,
    AsyncPipe,
    NzOptionComponent,
    WidgetSettingsEditor,
    WidgetSettingsForm,
    WidgetSettingsFormItem
  ],
  templateUrl: './market-trends-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MarketTrendsSettingsComponent extends WidgetSettingsBase<MarketTrendsWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

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

  protected settings$!: Observable<MarketTrendsWidgetSettings>;

  protected readonly allSectors = Object.keys(MarketSector)
    .map(s => MarketSector[s as keyof typeof MarketSector]);

  protected readonly allExtendedFilters = Object.keys(ExtendedFilter)
    .map(s => ExtendedFilter[s as keyof typeof ExtendedFilter]);

  private readonly formBuilder = inject(FormBuilder);

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

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected getUpdatedSettings(initialSettings: MarketTrendsWidgetSettings): Partial<MarketTrendsWidgetSettings> {
    const formValue = this.form.value;

    return {
      ...initialSettings,
      itemsCount: formValue.itemsCount ?? 20,
      displaySectors: formValue.displaySectors ?? [],
      extendedFilter: formValue.extendedFilter ?? [],
    };
  }

  protected setCurrentFormValues(settings: MarketTrendsWidgetSettings): void {
    this.form.reset();

    this.form.controls.itemsCount.setValue(settings.itemsCount);
    this.form.controls.displaySectors.setValue(settings.displaySectors);
    this.form.controls.extendedFilter.setValue(settings.extendedFilter);
  }
}

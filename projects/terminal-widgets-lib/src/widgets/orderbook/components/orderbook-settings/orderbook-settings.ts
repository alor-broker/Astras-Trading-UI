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
} from '@angular/forms';
import {Observable} from 'rxjs';
import {
  NzMarks,
  NzSliderComponent
} from 'ng-zorro-antd/slider';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  ColumnsOrder,
  OrderbookWidgetSettings
} from '@terminal-widgets-lib/widgets/orderbook/widget-settings.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';
import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';

@Component({
  selector: 'ats-orderbook-settings',
  templateUrl: './orderbook-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzInputDirective,
    NzSliderComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzTypographyComponent,
    WidgetSettingsEditor,
    WidgetSettingsGroup,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    WidgetSettingsSwitch,
    InlineInstrumentSearch,
    InstrumentBoardSelect
  ]
})
export class OrderbookSettings extends WidgetSettingsBase<OrderbookWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly DeviceVisibility = SettingsDeviceVisibility;

  readonly validationOptions = {
    depth: {
      min: 1,
      max: 50
    }
  };

  readonly depthMarks: NzMarks = {
    [this.validationOptions.depth.min]: this.validationOptions.depth.min.toString(),
    [this.validationOptions.depth.max]: this.validationOptions.depth.max.toString()
  };

  readonly columnsOrderEnum = ColumnsOrder;

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  protected settings$!: Observable<OrderbookWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.group({
      instrumentKey: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
      instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null)
    }),
    view: this.formBuilder.group({
      depth: this.formBuilder.nonNullable.control(
        17,
        [
          Validators.required,
          Validators.min(this.validationOptions.depth.min),
          Validators.max(this.validationOptions.depth.max)
        ]
      ),
      showChart: this.formBuilder.nonNullable.control(true),
      showTable: this.formBuilder.nonNullable.control(true),
      showYieldForBonds: this.formBuilder.nonNullable.control(false),
      showVolume: this.formBuilder.nonNullable.control(false),
      columnsOrder: this.formBuilder.nonNullable.control(ColumnsOrder.VolumesAtTheEdges),
      volumeDisplayFormat: this.formBuilder.nonNullable.control(NumberDisplayFormat.Default),
      showPriceWithZeroPadding: this.formBuilder.nonNullable.control(false)
    }),
    orders: this.formBuilder.group({
      useOrderWidget: this.formBuilder.nonNullable.control(false)
    })
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected get instrument(): InstrumentKey | null {
    return this.form.controls.instrument.controls.instrumentKey.value;
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrument.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  protected getUpdatedSettings(initialSettings: OrderbookWidgetSettings): Partial<OrderbookWidgetSettings> {
    const value = this.form.getRawValue();
    const instrument = InstrumentKeyHelper.toInstrumentKey({
      ...value.instrument.instrumentKey ?? initialSettings,
      instrumentGroup: value.instrument.instrumentGroup
    });

    return {
      ...instrument,
      ...value.view,
      ...value.orders,
      linkToActive: (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, instrument)
    };
  }

  protected setCurrentFormValues(settings: OrderbookWidgetSettings): void {
    this.form.reset({
      instrument: {
        instrumentKey: InstrumentKeyHelper.toInstrumentKey(settings),
        instrumentGroup: settings.instrumentGroup ?? null
      },
      view: {
        depth: settings.depth ?? 17,
        showChart: settings.showChart ?? true,
        showTable: settings.showTable ?? true,
        showYieldForBonds: settings.showYieldForBonds ?? false,
        showVolume: settings.showVolume ?? false,
        columnsOrder: settings.columnsOrder ?? ColumnsOrder.VolumesAtTheEdges,
        volumeDisplayFormat: settings.volumeDisplayFormat ?? NumberDisplayFormat.Default,
        showPriceWithZeroPadding: settings.showPriceWithZeroPadding ?? false
      },
      orders: {
        useOrderWidget: settings.useOrderWidget ?? false
      }
    });
  }
}

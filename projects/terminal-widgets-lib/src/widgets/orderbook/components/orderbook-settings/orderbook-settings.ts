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
} from '@angular/forms';
import {
  Observable,
  take
} from "rxjs";

import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
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
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {AsyncPipe} from '@angular/common';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {
  ColumnsOrder,
  OrderbookWidgetSettings
} from '@terminal-widgets-lib/widgets/orderbook/widget-settings.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';

@Component({
  selector: 'ats-orderbook-settings',
  templateUrl: './orderbook-settings.html',
  styleUrls: ['./orderbook-settings.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzInputDirective,
    NzSliderComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzSwitchComponent,
    NzIconDirective,
    NzPopoverDirective,
    AsyncPipe,
    WidgetSettings,
    InlineInstrumentSearch,
    InstrumentBoardSelect
  ]
})
export class OrderbookSettings extends WidgetSettingsBase<OrderbookWidgetSettings> implements OnInit {
  readonly validationOptions = {
    depth: {
      min: 1,
      max: 50
    }
  };

  columnsOrderEnum = ColumnsOrder;

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  protected settings$!: Observable<OrderbookWidgetSettings>;

  private readonly deviceService = inject(DeviceService);

  protected readonly deviceInfo$ = this.deviceService.deviceInfo$.pipe(take(1));

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
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
    useOrderWidget: this.formBuilder.nonNullable.control(false),
    showVolume: this.formBuilder.nonNullable.control(false),
    columnsOrder: this.formBuilder.nonNullable.control(ColumnsOrder.VolumesAtTheEdges),
    volumeDisplayFormat: this.formBuilder.nonNullable.control(NumberDisplayFormat.Default),
    showPriceWithZeroPadding: this.formBuilder.nonNullable.control(false),
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  getSliderMarks(minValue: number, maxValue: number): NzMarks {
    return {
      [minValue]: minValue.toString(),
      [maxValue]: maxValue.toString(),
    };
  }

  protected getUpdatedSettings(initialSettings: OrderbookWidgetSettings): Partial<OrderbookWidgetSettings> {
    const formValue = this.form.getRawValue() as Partial<OrderbookWidgetSettings & { instrument: InstrumentKey }>;

    const newSettings = {
      ...formValue,
      depth: Number(this.form.value.depth!),
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange
    } as OrderbookWidgetSettings;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, newSettings);

    return newSettings;
  }

  protected setCurrentFormValues(settings: OrderbookWidgetSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.depth.setValue(settings.depth ?? 17);
    this.form.controls.showChart.setValue(settings.showChart);
    this.form.controls.showTable.setValue(settings.showTable);
    this.form.controls.showYieldForBonds.setValue(settings.showYieldForBonds);
    this.form.controls.useOrderWidget.setValue(settings.useOrderWidget ?? false);
    this.form.controls.showVolume.setValue(settings.showVolume ?? false);
    this.form.controls.columnsOrder.setValue(settings.columnsOrder ?? ColumnsOrder.VolumesAtTheEdges);
    this.form.controls.volumeDisplayFormat.setValue(settings.volumeDisplayFormat ?? NumberDisplayFormat.Default);
    this.form.controls.showPriceWithZeroPadding.setValue(settings.showPriceWithZeroPadding ?? false);
  }
}

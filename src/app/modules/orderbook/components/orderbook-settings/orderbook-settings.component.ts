import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  FormBuilder,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Observable,
  take
} from "rxjs";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  ColumnsOrder,
  OrderbookSettings
} from '../../models/orderbook-settings.model';
import { DeviceService } from "../../../../shared/services/device.service";
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { NzMarks } from "ng-zorro-antd/slider";

@Component({
    selector: 'ats-orderbook-settings',
    templateUrl: './orderbook-settings.component.html',
    styleUrls: ['./orderbook-settings.component.less'],
    standalone: false
})
export class OrderbookSettingsComponent extends WidgetSettingsBaseComponent<OrderbookSettings> implements OnInit {
  readonly validationOptions = {
    depth: {
      min: 1,
      max: 50
    }
  };

  columnsOrderEnum = ColumnsOrder;

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  @Input({ required: true })
  guid!: string;

  @Output()
  settingsChange = new EventEmitter<void>();

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

  deviceInfo$!: Observable<any>;

  protected settings$!: Observable<OrderbookSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly deviceService: DeviceService,
    private readonly formBuilder: FormBuilder,
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

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );
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

  protected getUpdatedSettings(initialSettings: OrderbookSettings): Partial<OrderbookSettings> {
    const formValue = this.form.getRawValue() as Partial<OrderbookSettings & { instrument: InstrumentKey }>;

    const newSettings = {
      ...formValue,
      depth: Number(this.form.value.depth!),
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange
    } as OrderbookSettings;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    return newSettings;
  }

  protected setCurrentFormValues(settings: OrderbookSettings): void {
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

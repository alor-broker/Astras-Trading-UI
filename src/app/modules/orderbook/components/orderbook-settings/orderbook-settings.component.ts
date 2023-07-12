import {Component, DestroyRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { FormControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Observable, shareReplay, take } from "rxjs";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { ColumnsOrder, OrderbookSettings } from '../../models/orderbook-settings.model';
import { DeviceService } from "../../../../shared/services/device.service";
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-orderbook-settings[settingsChange][guid]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.less']
})
export class OrderbookSettingsComponent implements OnInit {
  readonly validationOptions = {
    depth: {
      min: 1,
      max: 20
    }
  };
  columnsOrderEnum = ColumnsOrder;

  readonly availableNumberFormats = Object.values(NumberDisplayFormat);

  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: UntypedFormGroup;
  exchanges: string[] = exchangesList;
  deviceInfo$!: Observable<any>;

  private settings$!: Observable<OrderbookSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly deviceService: DeviceService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        instrument: new UntypedFormControl({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        } as InstrumentKey, Validators.required),
        exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
        depth: new FormControl(
          settings.depth ?? 17,
          [
            Validators.required,
            Validators.min(this.validationOptions.depth.min),
            Validators.max(this.validationOptions.depth.max)
          ]),
        instrumentGroup: new FormControl(settings.instrumentGroup ?? ''),
        showChart: new FormControl(settings.showChart),
        showTable: new FormControl(settings.showTable),
        showYieldForBonds: new FormControl(settings.showYieldForBonds),
        useOrderWidget: new FormControl(settings.useOrderWidget ?? false),
        showVolume: new FormControl(settings.showVolume ?? false),
        columnsOrder: new FormControl(settings.columnsOrder ?? ColumnsOrder.volumesAtTheEdges),
        volumeDisplayFormat: new UntypedFormControl(settings.volumeDisplayFormat ?? NumberDisplayFormat.Default),
      });
    });
  }

  submitForm(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const formValue = this.form.getRawValue();

      const newSettings = {
        ...formValue,
        depth: Number(this.form.value.depth!),
        symbol: formValue.instrument.symbol,
        exchange: formValue.instrument.exchange
      } as OrderbookSettings;

      newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);
      this.settingsService.updateSettings<OrderbookSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  instrumentSelected(instrument: InstrumentKey | null) {
    this.form.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }
}

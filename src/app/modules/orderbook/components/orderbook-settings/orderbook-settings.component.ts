import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  FormControl,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookSettings } from "../../../../shared/models/settings/orderbook-settings.model";
import {
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil
} from "rxjs";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';

@Component({
  selector: 'ats-orderbook-settings[settingsChange][guid]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.less']
})
export class OrderbookSettingsComponent implements OnInit, OnDestroy {
  readonly validationOptions = {
    depth: {
      min: 1,
      max: 20
    }
  };

  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: UntypedFormGroup;
  exchanges: string[] = exchangesList;
  private settings$!: Observable<OrderbookSettings>;

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        instrument: new UntypedFormControl({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        } as InstrumentKey, Validators.required),
        exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
        depth: new FormControl(
          settings.depth ?? 10,
          [
            Validators.required,
            Validators.min(this.validationOptions.depth.min),
            Validators.max(this.validationOptions.depth.max)
          ]),
        instrumentGroup: new FormControl(settings.instrumentGroup ?? ''),
        showChart: new FormControl(settings.showChart),
        showTable: new FormControl(settings.showTable),
        showYieldForBonds: new FormControl(settings.showYieldForBonds),
        useOrderWidget: new FormControl(settings.useOrderWidget ?? false)
      });
    });
  }

  submitForm(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const formValue = this.form.value;

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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  instrumentSelected(instrument: Instrument | null) {
    this.form.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }
}

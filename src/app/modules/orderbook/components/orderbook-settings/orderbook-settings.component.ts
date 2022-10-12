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
  FormGroup,
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
import { InstrumentValidation } from '../../../../shared/utils/validation-options';
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { ControlsOf } from '../../../../shared/models/form.model';

interface SettingsFormData {
  depth: number,
  exchange: string,
  symbol: string,
  instrumentGroup: string,
  showChart: boolean,
  showTable: boolean,
  showYieldForBonds: boolean,
  useOrderWidget: boolean
}

@Component({
  selector: 'ats-orderbook-settings[settingsChange][guid]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.less']
})
export class OrderbookSettingsComponent implements OnInit, OnDestroy {
  readonly validationOptions = {
    ...InstrumentValidation,
    depth: {
      min: 1,
      max: 20
    }
  };

  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: FormGroup<ControlsOf<SettingsFormData>>;
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
      this.form = new FormGroup<ControlsOf<SettingsFormData>>({
        symbol: new FormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(this.validationOptions.symbol.min),
          Validators.maxLength(this.validationOptions.symbol.max)
        ]),
        exchange: new FormControl(settings.exchange, Validators.required),
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
      const newSettings = {
        ...this.form.value,
          showChart: this.form.value.showChart!,
          showTable: this.form.value.showTable!,
          showYieldForBonds: this.form.value.showYieldForBonds!,
          useOrderWidget: this.form.value.useOrderWidget!,
          depth: Number(this.form.value.depth!),
          symbol: this.form.value.symbol!,
          instrumentGroup: this.form.value.instrumentGroup!,
          exchange: this.form.value.exchange!,
      } as OrderbookSettings;

      newSettings.linkToActive = isInstrumentEqual(initialSettings, newSettings);
      this.settingsService.updateSettings<OrderbookSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

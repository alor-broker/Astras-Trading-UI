import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookSettings } from "../../../../shared/models/settings/orderbook-settings.model";
import {
  Subject,
  takeUntil
} from "rxjs";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { InstrumentValidation } from '../../../../shared/utils/validation-options';

interface SettingsFormData {
  depth: number,
  exchange: string,
  symbol: string,
  instrumentGroup: string,
  showChart: boolean,
  showTable: boolean,
  showYieldForBonds: boolean,
}

type SettingsFormControls = { [key in keyof SettingsFormData]: AbstractControl };
type SettingsFormGroup = UntypedFormGroup & { value: SettingsFormData, controls: SettingsFormControls };

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
  form!: SettingsFormGroup;
  exchanges: string[] = exchangesList;

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        symbol: new UntypedFormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(this.validationOptions.symbol.min),
          Validators.maxLength(this.validationOptions.symbol.max)
        ]),
        exchange: new UntypedFormControl(settings.exchange, Validators.required),
        depth: new UntypedFormControl(
          settings.depth,
          [
            Validators.required,
            Validators.min(this.validationOptions.depth.min),
            Validators.max(this.validationOptions.depth.max)
          ]),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup),
        showChart: new UntypedFormControl(settings.showChart),
        showTable: new UntypedFormControl(settings.showTable),
        showYieldForBonds: new UntypedFormControl(settings.showYieldForBonds),
        useOrderWidget: new UntypedFormControl(settings.useOrderWidget)
      } as SettingsFormControls) as SettingsFormGroup;
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings(
      this.guid,
      {
        ...this.form.value,
        depth: Number(this.form.value.depth),
        linkToActive: false
      });

    this.settingsChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

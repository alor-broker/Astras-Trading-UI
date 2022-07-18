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
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookSettings } from "../../../../shared/models/settings/orderbook-settings.model";
import {
  Subject,
  takeUntil
} from "rxjs";

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
type SettingsFormGroup = FormGroup & { value: SettingsFormData, controls: SettingsFormControls };

@Component({
  selector: 'ats-orderbook-settings[settingsChange][guid]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.less']
})
export class OrderbookSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: SettingsFormGroup;
  readonly validationOptions = {
    minDepth: 0,
    maxDepth: 20
  };
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new FormGroup({
        symbol: new FormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(1)
        ]),
        exchange: new FormControl(settings.exchange, Validators.required),
        depth: new FormControl(settings.depth, [Validators.required, Validators.min(this.validationOptions.minDepth), Validators.max(this.validationOptions.maxDepth)]),
        instrumentGroup: new FormControl(settings.instrumentGroup),
        showChart: new FormControl(settings.showChart),
        showTable: new FormControl(settings.showTable),
        showYieldForBonds: new FormControl(settings.showYieldForBonds)
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

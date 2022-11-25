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
  FormArray,
  FormControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import {
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderSubmitSettings } from "../../../../shared/models/settings/order-submit-settings.model";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';

@Component({
  selector: 'ats-order-submit-settings[settingsChange][guid]',
  templateUrl: './order-submit-settings.component.html',
  styleUrls: ['./order-submit-settings.component.less']
})
export class OrderSubmitSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: UntypedFormGroup;
  exchanges: string[] = exchangesList;

  readonly validationOptions = {
    limitOrderPriceMoveStep: {
      min: 1,
      max: 200
    }
  };

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$!: Observable<OrderSubmitSettings>;

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<OrderSubmitSettings>(this.guid).pipe(
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
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup),
        enableLimitOrdersFastEditing: new UntypedFormControl(settings.enableLimitOrdersFastEditing ?? false),
        limitOrderPriceMoveSteps: new FormArray(
          [...settings.limitOrderPriceMoveSteps]
            .sort((a, b) => a - b)
            .map(x => this.createLimitOrderPriceMoveStepControl(x)
            )
        )
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
        symbol: formValue.instrument.symbol,
        exchange: formValue.instrument.exchange,
        limitOrderPriceMoveSteps: formValue.limitOrderPriceMoveSteps.map((x: number) => Number(x))
      };

      delete newSettings.instrument;
      newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<OrderSubmitSettings>(this.guid, newSettings);
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

  asFormArray(control: AbstractControl): UntypedFormArray {
    return control as UntypedFormArray;
  }

  asFormControl(control: AbstractControl): UntypedFormControl {
    return control as UntypedFormControl;
  }

  removeLimitOrderPriceMoveStep($event: MouseEvent, index: number) {
    $event.preventDefault();
    $event.stopPropagation();

    this.asFormArray(this.form.controls.limitOrderPriceMoveSteps).removeAt(index);
  }

  addLimitOrderPriceMoveStep($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    const stepsControl = this.asFormArray(this.form.controls.limitOrderPriceMoveSteps);
    const defaultValue = stepsControl.controls[stepsControl.length - 1].value as number;
    stepsControl.push(this.createLimitOrderPriceMoveStepControl(defaultValue));
  }

  private createLimitOrderPriceMoveStepControl(defaultValue: number): FormControl<number | null> {
    return new FormControl(
      defaultValue,
      [
        Validators.required,
        Validators.min(this.validationOptions.limitOrderPriceMoveStep.min),
        Validators.max(this.validationOptions.limitOrderPriceMoveStep.max)
      ]
    );
  }
}

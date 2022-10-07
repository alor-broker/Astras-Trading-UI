import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import {
  Timeframe,
  TimeframesHelper
} from '../../utils/timeframes-helper';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Subject,
  takeUntil
} from "rxjs";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { InstrumentValidation } from '../../../../shared/utils/validation-options';

@Component({
  selector: 'ats-light-chart-settings[guid]',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less']
})
export class LightChartSettingsComponent implements OnInit, OnDestroy {
  readonly validationOptions = InstrumentValidation;
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<LightChartSettings> = new EventEmitter<LightChartSettings>();
  form!: UntypedFormGroup;
  timeFrames: Timeframe[];
  exchanges: string[] = exchangesList;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
    this.timeFrames = TimeframesHelper.timeFrames;
  }

  ngOnInit() {
    this.settingsService.getSettings<LightChartSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        symbol: new UntypedFormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(this.validationOptions.symbol.min),
          Validators.maxLength(this.validationOptions.symbol.max)
        ]),
        exchange: new UntypedFormControl(settings.exchange, Validators.required),
        timeFrame: new UntypedFormControl(settings.timeFrame, Validators.required),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup)
      });
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings<LightChartSettings>(
      this.guid,
      {
        ...this.form.value,
        linkToActive: false
      });

    this.settingsChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

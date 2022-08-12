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

@Component({
  selector: 'ats-light-chart-settings[guid]',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less']
})
export class LightChartSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<LightChartSettings> = new EventEmitter<LightChartSettings>();
  form!: FormGroup;
  timeFrames: Timeframe[];
  exchanges: string[] = ['MOEX', 'SPBX'];
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
    this.timeFrames = TimeframesHelper.timeFrames;
  }

  ngOnInit() {
    this.settingsService.getSettings<LightChartSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new FormGroup({
        symbol: new FormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(4)
        ]),
        exchange: new FormControl(settings.exchange, Validators.required),
        timeFrame: new FormControl(settings.timeFrame, Validators.required),
        instrumentGroup: new FormControl(settings.instrumentGroup)
      });
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings(
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

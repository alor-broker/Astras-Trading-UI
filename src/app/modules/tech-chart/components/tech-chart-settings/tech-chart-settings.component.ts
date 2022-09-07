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
} from "@angular/forms";
import {
  Subject,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { TechChartSettings } from "../../../../shared/models/settings/tech-chart-settings.model";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { InstrumentValidation } from '../../../../shared/utils/validation-options';

@Component({
  selector: 'ats-tech-chart-settings[settingsChange][guid]',
  templateUrl: './tech-chart-settings.component.html',
  styleUrls: ['./tech-chart-settings.component.less']
})
export class TechChartSettingsComponent implements OnInit, OnDestroy {
  readonly validationOptions = InstrumentValidation;
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: FormGroup;
  exchanges: string[] = exchangesList;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settingsService.getSettings<TechChartSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new FormGroup({
        symbol: new FormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(this.validationOptions.symbol.min),
          Validators.maxLength(this.validationOptions.symbol.max)
        ]),
        exchange: new FormControl(settings.exchange, Validators.required),
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

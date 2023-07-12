import {
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import {
  Observable,
  shareReplay,
  take,
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-tech-chart-settings[settingsChange][guid]',
  templateUrl: './tech-chart-settings.component.html',
  styleUrls: ['./tech-chart-settings.component.less']
})
export class TechChartSettingsComponent implements OnInit {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: UntypedFormGroup;
  private settings$!: Observable<TechChartSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<TechChartSettings>(this.guid).pipe(
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
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup)
      });
    });
  }

  submitForm(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const formValue = this.form.value;
      const newSettings = {
        ...this.form.value,
        symbol: formValue.instrument.symbol,
        exchange: formValue.instrument.exchange,
      };

      delete newSettings.instrument;
      newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

      this.settingsService.updateSettings(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  instrumentSelected(instrument: InstrumentKey | null) {
    this.form.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }
}

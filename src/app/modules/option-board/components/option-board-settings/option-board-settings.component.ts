import {Component, DestroyRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Observable, shareReplay, take} from "rxjs";
import {UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {isInstrumentEqual} from "../../../../shared/utils/settings-helper";
import {OptionBoardSettings} from "../../models/option-board-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-option-board-settings[guid]',
  templateUrl: './option-board-settings.component.html',
  styleUrls: ['./option-board-settings.component.less']
})
export class OptionBoardSettingsComponent implements OnInit {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: UntypedFormGroup;
  private settings$!: Observable<OptionBoardSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<OptionBoardSettings>(this.guid).pipe(
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
        exchange: new UntypedFormControl({value: settings.exchange, disabled: true}, Validators.required),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup)
      });
    });
  }

  instrumentSelected(instrument: InstrumentKey | null) {
    this.form.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
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
      };

      delete newSettings.instrument;
      newSettings.linkToActive = initialSettings.linkToActive && isInstrumentEqual(initialSettings, newSettings);

      this.widgetSettingsService.updateSettings<OptionBoardSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }
}

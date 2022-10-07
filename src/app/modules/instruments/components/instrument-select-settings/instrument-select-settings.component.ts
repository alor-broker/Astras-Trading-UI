import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  allInstrumentsColumns,
  ColumnIds,
  InstrumentSelectSettings
} from 'src/app/shared/models/settings/instrument-select-settings.model';
import {
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import {
  Subject,
  takeUntil
} from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

@Component({
  selector: 'ats-instrument-select-settings[guid]',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent implements OnInit, OnDestroy {
  settingsForm!: UntypedFormGroup;
  allInstrumentColumns: ColumnIds[] = allInstrumentsColumns;
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<InstrumentSelectSettings> = new EventEmitter<InstrumentSelectSettings>();
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.buildSettingsForm(settings);
    });
  }

  saveSettings() {
    if (this.settingsForm?.valid) {
      this.settingsService.updateSettings<InstrumentSelectSettings>(
        this.guid,
        {
          ...this.settingsForm.value
        }
      );

      this.settingsChange.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private buildSettingsForm(currentSettings: InstrumentSelectSettings) {
    this.settingsForm = new UntypedFormGroup({
      instrumentColumns: new UntypedFormControl(currentSettings.instrumentColumns)
    });
  }
}

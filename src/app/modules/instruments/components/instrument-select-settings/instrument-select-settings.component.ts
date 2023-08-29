import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  allInstrumentsColumns,
  InstrumentSelectSettings
} from '../../models/instrument-select-settings.model';
import { BaseColumnId } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-instrument-select-settings',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent implements OnInit {
  settingsForm!: UntypedFormGroup;
  allInstrumentColumns: BaseColumnId[] = allInstrumentsColumns;
  @Input({required: true})
  guid!: string;
  @Output()
  settingsChange: EventEmitter<InstrumentSelectSettings> = new EventEmitter<InstrumentSelectSettings>();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      takeUntilDestroyed(this.destroyRef)
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

  private buildSettingsForm(currentSettings: InstrumentSelectSettings) {
    this.settingsForm = new UntypedFormGroup({
      instrumentColumns: new UntypedFormControl(currentSettings.instrumentColumns)
    });
  }
}

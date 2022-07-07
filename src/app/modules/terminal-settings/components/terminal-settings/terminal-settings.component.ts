import {
  Component,
  OnInit
} from '@angular/core';
import {
  Observable,
  of,
  take
} from 'rxjs';
import { FullName } from '../../../../shared/models/user/full-name.model';
import { TerminalSettingsService } from '../../services/terminal-settings.service';
import {
  TerminalSettingsFormControls,
  TerminalSettingsFormGroup
} from '../../models/terminal-settings-form.model';
import { Store } from '@ngrx/store';
import { TerminalSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { updateTerminalSettings } from '../../../../store/terminal-settings/terminal-settings.actions';

@Component({
  selector: 'ats-terminal-settings',
  templateUrl: './terminal-settings.component.html',
  styleUrls: ['./terminal-settings.component.less']
})
export class TerminalSettingsComponent implements OnInit {
  readonly validationSettings = {
    userIdleDurationMin: {
      min: 1,
      max: 1140
    }
  };

  timezoneDisplayOption = TimezoneDisplayOption;

  settingsForm!: TerminalSettingsFormGroup;

  fullName$: Observable<FullName> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });

  constructor(private readonly service: TerminalSettingsService, private readonly store: Store) {
  }

  ngOnInit(): void {
    this.fullName$ = this.service.getFullName();
    this.initForm();
  }

  saveSettingsChanges() {
    if (this.settingsForm?.valid) {
      this.store.dispatch(updateTerminalSettings({
        updates: {
          ...this.settingsForm.value,
          userIdleDurationMin: Number(this.settingsForm.value.userIdleDurationMin)
        } as TerminalSettings
      }));
    }
  }

  hotkeyChange(e: KeyboardEvent, controlName: string) {
    e.stopPropagation();
    this.settingsForm.get(controlName)?.setValue(e.key);
  }

  private initForm() {
    this.service.getSettings()
      .pipe(
        take(1)
      ).subscribe(settings => {
      this.settingsForm = this.buildForm(settings);
    });
  }

  private buildForm(currentSettings: TerminalSettings): TerminalSettingsFormGroup {
    return new FormGroup({
        timezoneDisplayOption: new FormControl(currentSettings.timezoneDisplayOption, Validators.required),
        userIdleDurationMin: new FormControl(
          currentSettings.userIdleDurationMin,
          [
            Validators.required,
            Validators.min(this.validationSettings.userIdleDurationMin.min),
            Validators.max(this.validationSettings.userIdleDurationMin.max)
          ]),
      cancelOrdersKey: new FormControl(currentSettings.cancelOrdersKey, Validators.required),
      closePositionsKey: new FormControl(currentSettings.closePositionsKey, Validators.required),
      centerOrderbookKey: new FormControl(currentSettings.centerOrderbookKey, Validators.required),
      } as TerminalSettingsFormControls
    ) as TerminalSettingsFormGroup;
  }
}

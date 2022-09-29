import {
  Component, EventEmitter, OnDestroy,
  OnInit, Output
} from '@angular/core';
import {
  Observable,
  of, Subject,
  take, takeUntil
} from 'rxjs';
import { FullName } from '../../../../shared/models/user/full-name.model';
import { TerminalSettingsService } from '../../services/terminal-settings.service';
import {
  TerminalSettingsFormControls,
  TerminalSettingsFormGroup
} from '../../models/terminal-settings-form.model';
import { TerminalSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { ThemeType } from 'src/app/shared/models/settings/theme-settings.model';

@Component({
  selector: 'ats-terminal-settings',
  templateUrl: './terminal-settings.component.html',
  styleUrls: ['./terminal-settings.component.less']
})
export class TerminalSettingsComponent implements OnInit, OnDestroy {
  readonly validationSettings = {
    userIdleDurationMin: {
      min: 1,
      max: 1140
    }
  };
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  @Output() formChange = new EventEmitter<{value: TerminalSettings, isInitial: boolean}>();

  timezoneDisplayOption = TimezoneDisplayOption;

  themeTypes = ThemeType;

  settingsForm!: TerminalSettingsFormGroup;

  fullName$: Observable<FullName> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });

  get hotKeysForm(): FormGroup {
    return this.settingsForm.get('hotKeysSettings') as FormGroup;
  }

  get workingVolumes(): FormArray {
    return this.hotKeysForm.get('workingVolumes') as FormArray;
  }

  get designSettingsForm(): FormGroup {
    return this.settingsForm.get('designSettings') as FormGroup;
  }

  constructor(private readonly service: TerminalSettingsService) {
  }

  ngOnInit(): void {
    this.fullName$ = this.service.getFullName();
    this.initForm();
  }

  hotkeyChange(e: KeyboardEvent, control: AbstractControl | null) {
    e.stopPropagation();
    if (e.key === 'Backspace') {
      control?.reset();
    } else {
      control?.setValue(e.key);
    }
  }

  addWorkingVolume(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.workingVolumes.push(new FormControl(null, Validators.required));
  }

  removeWorkingVolume(e: MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();

    this.workingVolumes.removeAt(index);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private initForm() {
    this.service.getSettings()
      .pipe(
        take(1)
      ).subscribe(settings => {
      this.settingsForm = this.buildForm(settings);
      this.formChange.emit( { value: this.settingsForm?.value, isInitial: true });
    });

    this.settingsForm.valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
          this.formChange.emit({value: this.settingsForm?.valid ? value : null, isInitial: false });
      });
  }

  private buildForm(currentSettings: TerminalSettings): TerminalSettingsFormGroup {
    return new FormGroup({
      designSettings: new FormGroup({
        theme: new FormControl(currentSettings.designSettings?.theme)
      }),
      timezoneDisplayOption: new FormControl(currentSettings.timezoneDisplayOption, Validators.required),
      userIdleDurationMin: new FormControl(
        currentSettings.userIdleDurationMin,
        [
          Validators.required,
          Validators.min(this.validationSettings.userIdleDurationMin.min),
          Validators.max(this.validationSettings.userIdleDurationMin.max)
        ]),
      badgesBind: new FormControl(currentSettings.badgesBind),
      hotKeysSettings: new FormGroup({
        cancelOrdersKey: new FormControl(currentSettings.hotKeysSettings?.cancelOrdersKey),
        closePositionsKey: new FormControl(currentSettings.hotKeysSettings?.closePositionsKey),
        centerOrderbookKey: new FormControl(currentSettings.hotKeysSettings?.centerOrderbookKey),
        cancelOrderbookOrders: new FormControl(currentSettings.hotKeysSettings?.cancelOrderbookOrders),
        closeOrderbookPositions: new FormControl(currentSettings.hotKeysSettings?.closeOrderbookPositions),
        reverseOrderbookPositions: new FormControl(currentSettings.hotKeysSettings?.reverseOrderbookPositions),
        buyMarket: new FormControl(currentSettings.hotKeysSettings?.buyMarket),
        sellMarket: new FormControl(currentSettings.hotKeysSettings?.sellMarket),
        workingVolumes: new FormArray(
          currentSettings.hotKeysSettings?.workingVolumes?.map(wv => new FormControl(wv, Validators.required))
          || []
        ),
        sellBestOrder: new FormControl(currentSettings.hotKeysSettings?.sellBestOrder),
        buyBestOrder: new FormControl(currentSettings.hotKeysSettings?.buyBestOrder),
        buyBestAsk: new FormControl(currentSettings.hotKeysSettings?.buyBestAsk),
        sellBestBid: new FormControl(currentSettings.hotKeysSettings?.sellBestBid),
      })
      } as TerminalSettingsFormControls
    ) as TerminalSettingsFormGroup;
  }
}

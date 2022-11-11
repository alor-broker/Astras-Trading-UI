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
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { ThemeType } from 'src/app/shared/models/settings/theme-settings.model';
import { TabNames } from "../../models/terminal-settings.model";

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
  @Output() tabChange = new EventEmitter<number>();

  timezoneDisplayOption = TimezoneDisplayOption;

  themeTypes = ThemeType;
  tabNames = TabNames;

  settingsForm!: TerminalSettingsFormGroup;

  fullName$: Observable<FullName> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });

  get hotKeysForm(): UntypedFormGroup {
    return this.settingsForm.get('hotKeysSettings') as UntypedFormGroup;
  }

  get workingVolumes(): UntypedFormArray {
    return this.hotKeysForm.get('workingVolumes') as UntypedFormArray;
  }

  get designSettingsForm(): UntypedFormGroup {
    return this.settingsForm.get('designSettings') as UntypedFormGroup;
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

    this.workingVolumes.push(new UntypedFormControl(null, Validators.required));
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
    return new UntypedFormGroup({
      designSettings: new UntypedFormGroup({
        theme: new UntypedFormControl(currentSettings.designSettings?.theme)
      }),
      timezoneDisplayOption: new UntypedFormControl(currentSettings.timezoneDisplayOption, Validators.required),
      userIdleDurationMin: new UntypedFormControl(
        currentSettings.userIdleDurationMin,
        [
          Validators.required,
          Validators.min(this.validationSettings.userIdleDurationMin.min),
          Validators.max(this.validationSettings.userIdleDurationMin.max)
        ]),
      badgesBind: new UntypedFormControl(currentSettings.badgesBind),
      hotKeysSettings: new UntypedFormGroup({
        cancelOrdersKey: new UntypedFormControl(currentSettings.hotKeysSettings?.cancelOrdersKey),
        closePositionsKey: new UntypedFormControl(currentSettings.hotKeysSettings?.closePositionsKey),
        centerOrderbookKey: new UntypedFormControl(currentSettings.hotKeysSettings?.centerOrderbookKey),
        cancelOrderbookOrders: new UntypedFormControl(currentSettings.hotKeysSettings?.cancelOrderbookOrders),
        closeOrderbookPositions: new UntypedFormControl(currentSettings.hotKeysSettings?.closeOrderbookPositions),
        reverseOrderbookPositions: new UntypedFormControl(currentSettings.hotKeysSettings?.reverseOrderbookPositions),
        buyMarket: new UntypedFormControl(currentSettings.hotKeysSettings?.buyMarket),
        sellMarket: new UntypedFormControl(currentSettings.hotKeysSettings?.sellMarket),
        workingVolumes: new UntypedFormArray(
          currentSettings.hotKeysSettings?.workingVolumes?.map(wv => new UntypedFormControl(wv, Validators.required))
          || []
        ),
        sellBestOrder: new UntypedFormControl(currentSettings.hotKeysSettings?.sellBestOrder),
        buyBestOrder: new UntypedFormControl(currentSettings.hotKeysSettings?.buyBestOrder),
        buyBestAsk: new UntypedFormControl(currentSettings.hotKeysSettings?.buyBestAsk),
        sellBestBid: new UntypedFormControl(currentSettings.hotKeysSettings?.sellBestBid),
      })
      } as TerminalSettingsFormControls
    ) as TerminalSettingsFormGroup;
  }
}

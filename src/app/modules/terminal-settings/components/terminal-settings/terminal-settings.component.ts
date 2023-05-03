import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  of,
  take,
  takeUntil
} from 'rxjs';
import { FullName } from '../../../../shared/models/user/full-name.model';
import { TerminalSettingsService } from '../../services/terminal-settings.service';
import { TerminalSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import {
  GeneralSettings,
  TabNames
} from "../../models/terminal-settings.model";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { Destroyable } from '../../../../shared/utils/destroyable';
import { AtsValidators } from '../../../../shared/utils/form-validators';
import { TerminalSettingsHelper } from '../../../../shared/utils/terminal-settings-helper';

@Component({
  selector: 'ats-terminal-settings',
  templateUrl: './terminal-settings.component.html',
  styleUrls: ['./terminal-settings.component.less']
})
export class TerminalSettingsComponent implements OnInit, OnDestroy {
  @Output() formChange = new EventEmitter<{ value: TerminalSettings | null, isInitial: boolean }>();
  @Output() tabChange = new EventEmitter<number>();
  tabNames = TabNames;
  settingsForm?: UntypedFormGroup;
  fullName$: Observable<FullName> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });
  excludedSettings: string[] = [];
  private readonly destroyable = new Destroyable();

  constructor(
    private readonly service: TerminalSettingsService,
    private readonly dashboardService: ManageDashboardsService,
    private modal: ModalService,
    private readonly translatorService: TranslatorService,
  ) {
  }

  ngOnInit(): void {
    this.fullName$ = this.service.getFullName();
    this.initForm();
  }

  clearDashboard() {
    this.translatorService.getTranslator('terminal-settings')
      .pipe(
        take(1)
      )
      .subscribe(t => {
        this.modal.openConfirmModal({
          nzTitle: t(['hardRebootWarningTitle']),
          nzContent: t(['hardRebootWarningDesc']),
          nzOkText: t(['yesBtnText']),
          nzOkType: 'primary',
          nzOkDanger: true,
          nzOnOk: () => this.dashboardService.resetAll(),
          nzCancelText: t(['noBtnText']),
          nzOnCancel: () => {
          }
        });
      });
  }

  ngOnDestroy() {
    this.destroyable.destroy();
  }

  getFormControl(key: string): UntypedFormControl | null {
    return this.settingsForm?.controls[key] as UntypedFormControl ?? null;
  }

  private initForm() {
    this.service.getSettings()
      .pipe(
        take(1)
      ).subscribe(settings => {
      this.settingsForm = this.buildForm(settings);
      this.excludedSettings = settings.excludedSettings ?? [];

      this.formChange.emit({ value: this.formToModel(), isInitial: true });

      this.settingsForm.valueChanges
        .pipe(
          takeUntil(this.destroyable)
        )
        .subscribe(() => {
          this.formChange.emit({
              value: this.settingsForm?.valid
                ? this.formToModel()!
                : null,
              isInitial: false
            }
          );
        });
    });
  }

  private formToModel(): TerminalSettings | null {
    const formValue = this.settingsForm?.value;
    if (!formValue) {
      return null;
    }

    const model = {
      ...formValue,
      ...formValue.generalSettings
    };

    delete model.generalSettings;

    return model;
  }

  private buildForm(currentSettings: TerminalSettings): UntypedFormGroup {
    return new UntypedFormGroup({
        generalSettings: new UntypedFormControl({
            designSettings: currentSettings.designSettings,
            language: currentSettings.language,
            timezoneDisplayOption: currentSettings.timezoneDisplayOption,
            userIdleDurationMin: currentSettings.userIdleDurationMin,
            badgesBind: currentSettings.badgesBind
          } as GeneralSettings,
          Validators.required),
        portfoliosCurrency: new UntypedFormControl(currentSettings.portfoliosCurrency ?? [], AtsValidators.notNull),
        hotKeysSettings: new UntypedFormControl(currentSettings.hotKeysSettings, Validators.required),
        instantNotificationsSettings: new UntypedFormControl(currentSettings.instantNotificationsSettings, Validators.required),
        scalperOrderBookMouseActions: new UntypedFormControl(
          currentSettings.scalperOrderBookMouseActions ?? TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme1(),
          Validators.required
        ),
      }
    );
  }
}

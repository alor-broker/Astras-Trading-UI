import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  of,
  take
} from 'rxjs';
import { FullName } from '../../../../shared/models/user/full-name.model';
import {
  HotKeysSettings,
  InstantNotificationsSettings,
  PortfolioCurrencySettings,
  ScalperOrderBookMouseActionsMap,
  TerminalSettings
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  FormBuilder,
  Validators
} from '@angular/forms';
import { ModalService } from "../../../../shared/services/modal.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { AtsValidators } from '../../../../shared/utils/form-validators';
import { TerminalSettingsHelper } from '../../../../shared/utils/terminal-settings-helper';
import { AccountService } from "../../../../shared/services/account.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import {
  GeneralSettings,
  TabNames
} from "../../models/terminal-settings.model";
import {
  EXPORT_SETTINGS_SERVICE_TOKEN,
  ExportSettingsService
} from "../../../../shared/services/settings/export-settings.service";
import {
  FileSaver,
  FileType
} from "../../../../shared/utils/file-export/file-saver";

@Component({
    selector: 'ats-terminal-settings',
    templateUrl: './terminal-settings.component.html',
    styleUrls: ['./terminal-settings.component.less'],
    standalone: false
})
export class TerminalSettingsComponent implements OnInit, OnDestroy {
  @Input()
  hiddenSections: string[] = [];

  @Output() formChange = new EventEmitter<{ value: TerminalSettings | null, isInitial: boolean }>();
  @Output() tabChange = new EventEmitter<number>();
  tabNames = TabNames;

  readonly settingsForm = this.formBuilder.group({
    generalSettings: this.formBuilder.nonNullable.control<GeneralSettings>({}, Validators.required),
    portfoliosCurrency: this.formBuilder.nonNullable.control<PortfolioCurrencySettings[]>([], AtsValidators.notNull),
    hotKeysSettings: this.formBuilder.control<HotKeysSettings | null>(null, Validators.required),
    instantNotificationsSettings: this.formBuilder.control<InstantNotificationsSettings | null>(null, Validators.required),
    scalperOrderBookMouseActions: this.formBuilder.control<ScalperOrderBookMouseActionsMap | null>(null, Validators.required),
  });

  fullName$: Observable<FullName> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });

  tabSetHeight$ = new BehaviorSubject(300);
  exportSettingsLoading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly accountService: AccountService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly modal: ModalService,
    private readonly translatorService: TranslatorService,
    @Inject(EXPORT_SETTINGS_SERVICE_TOKEN)
    private readonly exportSettingsService: ExportSettingsService,
    private readonly destroyRef: DestroyRef,
    private readonly elRef: ElementRef,
    private readonly formBuilder: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.fullName$ = this.accountService.getFullName();
    this.initForm();
  }

  ngOnDestroy(): void {
    this.tabSetHeight$.complete();
    this.exportSettingsLoading$.complete();
  }

  calculateTabSetHeight(): void {
    const modalBodyContainerEl = this.elRef.nativeElement.parentElement as HTMLElement;
    const containerHeight = window.innerHeight * 0.7 -
      parseFloat(window.getComputedStyle(modalBodyContainerEl).paddingTop) -
      parseFloat(window.getComputedStyle(modalBodyContainerEl).paddingBottom);

    const profileNameEl = this.elRef.nativeElement.querySelector('.profile-name') as HTMLElement;
    const profileNameHeight = +profileNameEl.offsetHeight + parseFloat(window.getComputedStyle(profileNameEl).marginBottom);

    this.tabSetHeight$.next(containerHeight - profileNameHeight);
  }

  clearDashboard(): void {
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
          nzOnOk: () => this.terminalSettingsService.reset(),
          nzCancelText: t(['noBtnText']),
          nzOnCancel: () => {
          }
        });
      });
  }

  exportSettings(): void {
    this.exportSettingsLoading$.next(true);
    setTimeout(() => {
      this.exportSettingsService.exportToFile().pipe(
        take(1)
      ).subscribe(result => {
        FileSaver.save(
          {
            name: result.filename,
            fileType: FileType.Json
          },
          result.content
        );

        this.exportSettingsLoading$.next(false);
      });
    });
  }

  private initForm(): void {
    this.terminalSettingsService.getSettings()
      .pipe(
        take(1)
      ).subscribe(settings => {
      this.setCurrentFormValues(settings);

      this.formChange.emit({value: this.formToModel(), isInitial: true});

      this.settingsForm.valueChanges
        .pipe(
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.formChange.emit({
              value: (this.settingsForm.valid)
                ? this.formToModel()!
                : null,
              isInitial: false
            }
          );
        });
    });
  }

  private formToModel(): TerminalSettings | null {
    const formValue = this.settingsForm.value as Partial<TerminalSettings & { generalSettings: GeneralSettings }> | undefined;
    if (!formValue) {
      return null;
    }

    const model = {
      ...formValue,
      ...formValue.generalSettings
    } as Partial<TerminalSettings & { generalSettings: GeneralSettings }>;

    delete model.generalSettings;

    return model as TerminalSettings;
  }

  private setCurrentFormValues(settings: TerminalSettings): void {
    this.settingsForm.reset();

    this.settingsForm.controls.generalSettings.setValue({
      designSettings: settings.designSettings,
      language: settings.language,
      timezoneDisplayOption: settings.timezoneDisplayOption,
      isLogoutOnUserIdle: settings.isLogoutOnUserIdle,
      userIdleDurationMin: settings.userIdleDurationMin,
      badgesBind: settings.badgesBind,
      badgesColors: settings.badgesColors,
      tableRowHeight: settings.tableRowHeight
    });

    this.settingsForm.controls.portfoliosCurrency.setValue(settings.portfoliosCurrency ?? []);

    this.settingsForm.controls.hotKeysSettings.setValue(settings.hotKeysSettings ?? null);

    this.settingsForm.controls.instantNotificationsSettings.setValue(settings.instantNotificationsSettings ?? null);

    this.settingsForm.controls.scalperOrderBookMouseActions.setValue(settings.scalperOrderBookMouseActions ?? TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme1());
  }
}

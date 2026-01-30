import {
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  input,
  output,
  inject
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
  MobileDashboardLayout,
  PortfolioCurrencySettings,
  ScalperOrderBookMouseActionsMap,
  TerminalSettings
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
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
import { NzResizeObserverDirective } from 'ng-zorro-antd/cdk/resize-observer';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import { UsefulLinksComponent } from '../useful-links/useful-links.component';
import { GeneralSettingsFormComponent } from '../general-settings-form/general-settings-form.component';
import { PortfoliosCurrencyFormComponent } from '../portfolios-currency-form/portfolios-currency-form.component';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { HotKeySettingsFormComponent } from '../hot-key-settings-form/hot-key-settings-form.component';
import { ScalperMouseActionsFormComponent } from '../scalper-mouse-actions-form/scalper-mouse-actions-form.component';
import { InstantNotificationsFormComponent } from '../instant-notifications-form/instant-notifications-form.component';
import { AsyncPipe } from '@angular/common';
import { MobileDashboardLayoutFormComponent } from "../mobile-dashboard-layout-form/mobile-dashboard-layout-form.component";

@Component({
  selector: 'ats-terminal-settings',
  templateUrl: './terminal-settings.component.html',
  styleUrls: ['./terminal-settings.component.less'],
  imports: [
    NzResizeObserverDirective,
    TranslocoDirective,
    NzIconDirective,
    NzTabsComponent,
    NzTabComponent,
    UsefulLinksComponent,
    GeneralSettingsFormComponent,
    FormsModule,
    ReactiveFormsModule,
    PortfoliosCurrencyFormComponent,
    NzDividerComponent,
    NzRowDirective,
    NzColDirective,
    NzButtonComponent,
    HotKeySettingsFormComponent,
    ScalperMouseActionsFormComponent,
    InstantNotificationsFormComponent,
    AsyncPipe,
    MobileDashboardLayoutFormComponent
  ]
})
export class TerminalSettingsComponent implements OnInit, OnDestroy {
  private readonly accountService = inject(AccountService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly modal = inject(ModalService);

  private readonly translatorService = inject(TranslatorService);

  private readonly exportSettingsService = inject<ExportSettingsService>(EXPORT_SETTINGS_SERVICE_TOKEN);

  private readonly destroyRef = inject(DestroyRef);

  private readonly elRef = inject(ElementRef);

  private readonly formBuilder = inject(FormBuilder);

  readonly hiddenSections = input<string[]>([]);

  readonly formChange = output<{
    value: TerminalSettings | null;
    isInitial: boolean;
  }>();

  readonly tabChange = output<number>();

  tabNames = TabNames;

  readonly settingsForm = this.formBuilder.group({
    generalSettings: this.formBuilder.nonNullable.control<GeneralSettings>({}, Validators.required),
    portfoliosCurrency: this.formBuilder.nonNullable.control<PortfolioCurrencySettings[]>([], AtsValidators.notNull),
    hotKeysSettings: this.formBuilder.control<HotKeysSettings | null>(null, Validators.required),
    instantNotificationsSettings: this.formBuilder.control<InstantNotificationsSettings | null>(null, Validators.required),
    scalperOrderBookMouseActions: this.formBuilder.control<ScalperOrderBookMouseActionsMap | null>(null, Validators.required),
    mobileDashboardLayout: this.formBuilder.control<MobileDashboardLayout | null>(null),
  });

  fullName$: Observable<FullName> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });

  tabSetHeight$ = new BehaviorSubject(300);

  exportSettingsLoading$ = new BehaviorSubject<boolean>(false);

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
    const formValue = this.settingsForm.value as Partial<TerminalSettings & {
      generalSettings: GeneralSettings;
    }> | undefined;
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
      tableRowHeight: settings.tableRowHeight,
      showCurrentTime: settings.showCurrentTime ?? false
    });

    this.settingsForm.controls.portfoliosCurrency.setValue(settings.portfoliosCurrency ?? []);

    this.settingsForm.controls.hotKeysSettings.setValue(settings.hotKeysSettings ?? null);

    this.settingsForm.controls.instantNotificationsSettings.setValue(settings.instantNotificationsSettings ?? null);

    this.settingsForm.controls.scalperOrderBookMouseActions.setValue(settings.scalperOrderBookMouseActions ?? TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme1());

    this.settingsForm.controls.mobileDashboardLayout.setValue(settings.mobileDashboardLayout ?? null);
  }
}

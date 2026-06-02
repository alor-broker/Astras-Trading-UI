import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  HotKeysSettings,
  InstantNotificationsSettings,
  MobileDashboardLayout,
  PortfolioCurrencySettings,
  ScalperOrderBookMouseActionsMap,
  TerminalSettings
} from '../../terminal-settings.types';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {NzModalService} from "ng-zorro-antd/modal";
import {TerminalSettingsService} from "../../services/terminal-settings.service";
import {EXPORT_SETTINGS_SERVICE_TOKEN} from '../../../export-settings/export-settings.types';
import {AccountService} from '../../../client-info/services/account-service';
import {
  GeneralSettings,
  TabNames
} from '../terminal-settings-editing.types';
import {
  BehaviorSubject,
  Observable,
  of,
  take
} from 'rxjs';
import {FullName} from '../../../client-info/services/account-service.types';
import {TranslatorService} from '../../../translations/services/translator.service';
import {atsNotNull} from '../../../forms/validators/not-null.validator';
import {
  FileSaver,
  FileType
} from '../../../../common/utils//files/file-saver';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TerminalSettingsHelper} from '../../utils/terminal-settings.helper';
import {AsyncPipe} from '@angular/common';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {UsefulLinks} from '../useful-links/useful-links';
import {GeneralSettingsForm} from '../general-settings-form/general-settings-form';
import {PortfoliosCurrencyForm} from '../portfolios-currency-form/portfolios-currency-form';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {HotkeySettingsForm} from '../hotkey-settings-form/hotkey-settings-form';
import {ScalperMouseActionsForm} from '../scalper-mouse-actions-form/scalper-mouse-actions-form';
import {InstantNotificationsForm} from '../instant-notifications-form/instant-notifications-form';
import {MobileDashboardLayoutForm} from '../mobile-dashboard-layout-form/mobile-dashboard-layout-form';

@Component({
  selector: 'ats-terminal-settings-editor',
  imports: [
    AsyncPipe,
    NzResizeObserverDirective,
    TranslocoDirective,
    NzIconDirective,
    NzTabsComponent,
    NzTabComponent,
    NzDividerComponent,
    NzRowDirective,
    NzColDirective,
    UsefulLinks,
    GeneralSettingsForm,
    ReactiveFormsModule,
    PortfoliosCurrencyForm,
    NzButtonComponent,
    HotkeySettingsForm,
    ScalperMouseActionsForm,
    InstantNotificationsForm,
    MobileDashboardLayoutForm
  ],
  templateUrl: './terminal-settings-editor.html',
  styleUrl: './terminal-settings-editor.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TerminalSettingsEditor implements OnInit, OnDestroy {
  readonly hiddenSections = input<string[]>([]);

  readonly formChange = output<{
    value: TerminalSettings | null;
    isInitial: boolean;
  }>();

  readonly tabChange = output<number>();

  tabNames = TabNames;

  fullName$: Observable<FullName | null> = of({
    firstName: '',
    lastName: '',
    secondName: ''
  });

  tabSetHeight$ = new BehaviorSubject(300);

  readonly exportSettingsLoading = signal(false);

  private readonly accountService = inject(AccountService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly nzModalService = inject(NzModalService);

  private readonly translatorService = inject(TranslatorService);

  private readonly exportSettingsService = inject(EXPORT_SETTINGS_SERVICE_TOKEN, {optional: true});

  private readonly destroyRef = inject(DestroyRef);

  private readonly elRef = inject(ElementRef);

  private readonly formBuilder = inject(FormBuilder);

  readonly settingsForm = this.formBuilder.group({
    generalSettings: this.formBuilder.nonNullable.control<GeneralSettings>({}, Validators.required),
    portfoliosCurrency: this.formBuilder.nonNullable.control<PortfolioCurrencySettings[]>([], atsNotNull),
    hotKeysSettings: this.formBuilder.control<HotKeysSettings | null>(null, Validators.required),
    instantNotificationsSettings: this.formBuilder.control<InstantNotificationsSettings | null>(null, Validators.required),
    scalperOrderBookMouseActions: this.formBuilder.control<ScalperOrderBookMouseActionsMap | null>(null, Validators.required),
    mobileDashboardLayout: this.formBuilder.control<MobileDashboardLayout | null>(null),
  });

  ngOnInit(): void {
    this.fullName$ = this.accountService.getFullName();
    this.initForm();
  }

  ngOnDestroy(): void {
    this.tabSetHeight$.complete();
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
        this.nzModalService.confirm({
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

  canExportSettings(): boolean {
    return this.exportSettingsService != null;
  }

  exportSettings(): void {
    this.exportSettingsLoading.set(true);
    setTimeout(() => {
      this.exportSettingsService!.exportToFile().pipe(
        take(1)
      ).subscribe(result => {
        FileSaver.save(
          {
            name: result.filename,
            fileType: FileType.Json
          },
          result.content
        );

        this.exportSettingsLoading.set(false);
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

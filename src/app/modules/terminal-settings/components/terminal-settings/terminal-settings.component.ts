import {
  Component, EventEmitter, OnDestroy,
  OnInit, Output
} from '@angular/core';
import {
  forkJoin,
  Observable,
  of,
  Subject,
  switchMap,
  take, takeUntil
} from 'rxjs';
import { FullName } from '../../../../shared/models/user/full-name.model';
import { TerminalSettingsService } from '../../services/terminal-settings.service';
import {
  TerminalSettingsFormControls,
  TerminalSettingsFormGroup
} from '../../models/terminal-settings-form.model';
import {
  PortfolioCurrency,
  TerminalSettings
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
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
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { CurrencyInstrument } from "../../../../shared/models/enums/currencies.model";
import { Store } from "@ngrx/store";
import { getAllPortfolios } from "../../../../store/portfolios/portfolios.selectors";
import { ExchangeRateService } from "../../../../shared/services/exchange-rate.service";
import { ExchangeRate } from "../../../exchange-rate/models/exchange-rate.model";
import { map } from "rxjs/operators";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { MarketService } from "../../../../shared/services/market.service";

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

  currencies$!: Observable<ExchangeRate[]>;

  get hotKeysForm(): UntypedFormGroup {
    return this.settingsForm.get('hotKeysSettings') as UntypedFormGroup;
  }

  get workingVolumes(): UntypedFormArray {
    return this.hotKeysForm.get('workingVolumes') as UntypedFormArray;
  }

  get designSettingsForm(): UntypedFormGroup {
    return this.settingsForm.get('designSettings') as UntypedFormGroup;
  }

  get portfoliosFormArr(): UntypedFormArray {
    return this.settingsForm.get('portfoliosCurrency') as UntypedFormArray;
  }

  constructor(
    private readonly service: TerminalSettingsService,
    private readonly dashboardService: ManageDashboardsService,
    private readonly store: Store,
    private readonly exchangeRateService: ExchangeRateService,
    private modal: ModalService,
    private readonly translatorService: TranslatorService,
    private readonly marketService: MarketService
  ) {
  }

  ngOnInit(): void {
    this.fullName$ = this.service.getFullName();
    this.currencies$ = this.exchangeRateService.getCurrencies()
      .pipe(
        map(cur => ([
          ...cur.filter(c => c.secondCode === 'RUB'),
          {
            firstCode: 'RUB',
            secondCode: 'RUB',
            symbolTom: CurrencyInstrument.RUB
          }
        ]))
      );
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

  getPortfoliosControl(i: number): UntypedFormControl {
    return this.portfoliosFormArr.at(i).get('currency') as UntypedFormControl;
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
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private initForm() {
    this.service.getSettings()
      .pipe(
        mapWith(
          (currentSettings) => this.store.select(getAllPortfolios)
            .pipe(
              switchMap(portfolios => forkJoin(
                portfolios.map(portfolio =>
                  this.marketService.getExchangeSettings(portfolio.exchange)
                    .pipe(map(p => {
                      const existingSettings = currentSettings.portfoliosCurrency?.find(
                        pc => pc.portfolio.portfolio === portfolio.portfolio && pc.portfolio.exchange === portfolio.exchange
                      );
                      return existingSettings || { portfolio, currency: p.currencyInstrument };
                    }))
                )
              ))
            ),
          (settings, portfolios: PortfolioCurrency[]) => ({settings, portfolios})
        ),
        take(1)
      ).subscribe(({settings, portfolios}) => {
      this.settingsForm = this.buildForm(settings, portfolios);
      this.formChange.emit( { value: this.settingsForm?.value, isInitial: true });
      this.settingsForm.valueChanges
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(value => {
          this.formChange.emit({value: this.settingsForm?.valid ? value : null, isInitial: false });
        });
    });
  }

  private buildForm(currentSettings: TerminalSettings, portfolios: PortfolioCurrency[]): TerminalSettingsFormGroup {
    return new UntypedFormGroup({
      portfoliosCurrency: new UntypedFormArray(
        portfolios.map(p => new UntypedFormGroup({
          currency: new UntypedFormControl(p.currency, Validators.required),
          portfolio: new UntypedFormControl(p.portfolio)
        }))
      ),
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
      language: new UntypedFormControl(currentSettings.language || ''),
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

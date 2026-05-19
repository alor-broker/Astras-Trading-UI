import {
  inject,
  Injectable,
  LOCALE_ID
} from '@angular/core';
import {
  combineLatest,
  NEVER,
  Observable,
  of,
  switchMap
} from "rxjs";
import {map} from "rxjs/operators";
import {PortfolioSubscriptionsService} from './portfolio-subscriptions';
import {TerminalSettingsService} from '../../terminal-settings/services/terminal-settings.service';
import {MarketService} from '../../market-config/market.service';
import {QuotesService} from '../../instruments/services/quotes.service';
import {PortfolioKey} from "../../../common/types/portfolio.types";
import {
  CommonSummaryView,
  ForwardRisksView
} from './portfolio-summary-service.types';
import {CurrencyFormat} from '../../market-config/market-config.types';
import {
  CommonSummaryModel,
  ForwardRisks,
  Risks
} from '../types/portfolio-summary.types';
import {CurrencyFormatHelper} from '../../../common/utils/currency-format.helper';

@Injectable({providedIn: 'root'})
export class PortfolioSummaryService {
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly marketService = inject(MarketService);

  private readonly quotes = inject(QuotesService);

  private readonly locale = inject(LOCALE_ID);

  getCommonSummary(portfolioKey: PortfolioKey): Observable<CommonSummaryView> {
    return combineLatest([
      this.portfolioSubscriptionsService.getSummariesSubscription(portfolioKey.portfolio, portfolioKey.exchange),
      this.getExchangeRate(portfolioKey.portfolio, portfolioKey.exchange)
    ]).pipe(
      map(([summary, quoteData]) => this.formatCommonSummary(summary, quoteData.currencyFormat, quoteData.quote))
    );
  }

  getForwardRisks(portfolioKey: PortfolioKey): Observable<ForwardRisksView> {
    return combineLatest({
        spectraRisks: this.portfolioSubscriptionsService.getSpectraRisksSubscription(portfolioKey.portfolio, portfolioKey.exchange),
        risks: this.portfolioSubscriptionsService.getRisksSubscription(portfolioKey.portfolio, portfolioKey.exchange),
        exchangeRate: this.getExchangeRate(portfolioKey.portfolio, portfolioKey.exchange)
      }
    ).pipe(
      map(x => this.formatForwardRisks(x.spectraRisks, x.risks, x.exchangeRate.currencyFormat, x.exchangeRate.quote))
    );
  }

  private getExchangeRate(portfolio: string, exchange: string): Observable<{
    currencyFormat: CurrencyFormat | null,
    quote: number
  }> {
    return combineLatest({
      terminalSettings: this.terminalSettingsService.getSettings(),
      marketSettings: this.marketService.getMarketSettings()
    }).pipe(
      switchMap(x => {
        const exchangeSettings = x.marketSettings.exchanges.find(e => e.exchange === exchange);
        if (exchangeSettings == null) {
          return NEVER;
        }

        const portfolioCurrency = x.terminalSettings.portfoliosCurrency?.find(pc =>
          pc.portfolio.portfolio === portfolio && pc.portfolio.exchange === exchange
        );

        const currencyInstrument = portfolioCurrency?.currency ?? exchangeSettings.settings.defaultPortfolioCurrencyInstrument;

        if (currencyInstrument === x.marketSettings.currencies.baseCurrency) {
          const baseCurrency = x.marketSettings.currencies.portfolioCurrencies.find(c => c.positionSymbol === x.marketSettings.currencies.baseCurrency);

          if (!baseCurrency || !baseCurrency.format) {
            return NEVER;
          }

          return of({currencyFormat: baseCurrency.format, quote: 1});
        }

        const currencyRecord = x.marketSettings.currencies.portfolioCurrencies.find(c => c.exchangeInstrument?.symbol === currencyInstrument);
        if (!currencyRecord) {
          return NEVER;
        }

        return this.quotes.getQuotesSubscription(currencyRecord.exchangeInstrument!.symbol, currencyRecord.exchangeInstrument!.exchange ?? x.marketSettings.currencies.defaultCurrencyExchange)
          .pipe(
            map(quote => ({currencyFormat: currencyRecord.format, quote: quote.last_price}))
          );
      })
    );
  }

  private formatCommonSummary(summary: CommonSummaryModel, currencyFormat: CurrencyFormat | null, exchangeRate: number): CommonSummaryView {
    return ({
      buyingPowerAtMorning: CurrencyFormatHelper.formatCurrency(summary.buyingPowerAtMorning / exchangeRate, this.locale, currencyFormat),
      buyingPower: CurrencyFormatHelper.formatCurrency(summary.buyingPower / exchangeRate, this.locale, currencyFormat),
      profit: CurrencyFormatHelper.formatCurrency(summary.profit / exchangeRate, this.locale, currencyFormat),
      profitRate: summary.profitRate,
      portfolioEvaluation: CurrencyFormatHelper.formatCurrency(summary.portfolioEvaluation / exchangeRate, this.locale, currencyFormat),
      portfolioLiquidationValue: CurrencyFormatHelper.formatCurrency(summary.portfolioLiquidationValue / exchangeRate, this.locale, currencyFormat),
      initialMargin: CurrencyFormatHelper.formatCurrency(summary.initialMargin / exchangeRate, this.locale, currencyFormat),
      correctedMargin: CurrencyFormatHelper.formatCurrency(summary.correctedMargin / exchangeRate, this.locale, currencyFormat),
      riskBeforeForcePositionClosing: CurrencyFormatHelper.formatCurrency(summary.riskBeforeForcePositionClosing / exchangeRate, this.locale, currencyFormat),
      commission: CurrencyFormatHelper.formatCurrency(summary.commission / exchangeRate, this.locale, currencyFormat),
      derivativesDebt: CurrencyFormatHelper.formatCurrency((summary.derivativesDebt ?? 0) / exchangeRate, this.locale, currencyFormat),
      hasDerivativesDebt: (summary.derivativesDebt ?? 0) < 0
    });
  }

  private formatForwardRisks(forwardRisks: ForwardRisks, risks: Risks, currencyFormat: CurrencyFormat | null, exchangeRate: number): ForwardRisksView {
    return {
      moneyFree: CurrencyFormatHelper.formatCurrency(forwardRisks.moneyFree / exchangeRate, this.locale, currencyFormat),
      moneyBlocked: CurrencyFormatHelper.formatCurrency(forwardRisks.moneyBlocked / exchangeRate, this.locale, currencyFormat),
      fee: CurrencyFormatHelper.formatCurrency(forwardRisks.fee / exchangeRate, this.locale, currencyFormat),
      moneyOld: CurrencyFormatHelper.formatCurrency(forwardRisks.moneyOld / exchangeRate, this.locale, currencyFormat),
      moneyAmount: CurrencyFormatHelper.formatCurrency(forwardRisks.moneyAmount / exchangeRate, this.locale, currencyFormat),
      moneyPledgeAmount: CurrencyFormatHelper.formatCurrency(forwardRisks.moneyPledgeAmount / exchangeRate, this.locale, currencyFormat),
      vmInterCl: CurrencyFormatHelper.formatCurrency(forwardRisks.vmInterCl / exchangeRate, this.locale, currencyFormat),
      vmCurrentPositions: CurrencyFormatHelper.formatCurrency(forwardRisks.vmCurrentPositions / exchangeRate, this.locale, currencyFormat),
      varMargin: CurrencyFormatHelper.formatCurrency(forwardRisks.varMargin / exchangeRate, this.locale, currencyFormat),
      isLimitsSet: forwardRisks.isLimitsSet,
      indicativeVarMargin: CurrencyFormatHelper.formatCurrency(forwardRisks.indicativeVarMargin / exchangeRate, this.locale, currencyFormat),
      netOptionValue: forwardRisks.netOptionValue,
      posRisk: CurrencyFormatHelper.formatCurrency(forwardRisks.posRisk / exchangeRate, this.locale, currencyFormat),
      portfolioLiquidationValue: CurrencyFormatHelper.formatCurrency(risks.portfolioLiquidationValue / exchangeRate, this.locale, currencyFormat),
      initialMargin: CurrencyFormatHelper.formatCurrency(risks.initialMargin / exchangeRate, this.locale, currencyFormat),
      minimalMargin: CurrencyFormatHelper.formatCurrency(risks.minimalMargin / exchangeRate, this.locale, currencyFormat),
      correctedMargin: CurrencyFormatHelper.formatCurrency(risks.correctedMargin / exchangeRate, this.locale, currencyFormat),
      riskCoverageRatioOne: CurrencyFormatHelper.formatCurrency(risks.riskCoverageRatioOne / exchangeRate, this.locale, currencyFormat),
      riskCoverageRatioTwo: CurrencyFormatHelper.formatCurrency(risks.riskCoverageRatioTwo / exchangeRate, this.locale, currencyFormat),
      riskStatus: risks.riskStatus,
      clientType: risks.clientType,
      portfolioEvaluation: CurrencyFormatHelper.formatCurrency((forwardRisks.moneyAmount + forwardRisks.varMargin - forwardRisks.fee) / exchangeRate, this.locale, currencyFormat),
      derivativesDebt: CurrencyFormatHelper.formatCurrency((forwardRisks.derivativesDebt ?? 0) / exchangeRate, this.locale, currencyFormat),
      hasDerivativesDebt: (forwardRisks.derivativesDebt ?? 0) < 0
    };
  }
}

import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { PortfolioKey } from "../models/portfolio-key.model";
import {
  combineLatest,
  NEVER,
  Observable,
  of,
  switchMap
} from "rxjs";
import { map } from "rxjs/operators";
import { CommonSummaryModel } from "../../modules/blotter/models/common-summary.model";
import { formatCurrency } from "../utils/formatters";
import { ForwardRisks } from "../../modules/blotter/models/forward-risks.model";
import { MarketService } from "./market.service";
import { PortfolioSubscriptionsService } from "./portfolio-subscriptions.service";
import { QuotesService } from "./quotes.service";
import { CommonSummaryView } from "../models/common-summary-view.model";
import { ForwardRisksView } from "../models/forward-risks-view.model";
import { TerminalSettingsService } from "./terminal-settings.service";
import { CurrencyFormat } from "../models/market-settings.model";
import { Risks } from "../../modules/blotter/models/risks.model";

@Injectable({
  providedIn: 'root'
})
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

  private getExchangeRate(portfolio: string, exchange: string): Observable<{ currencyFormat: CurrencyFormat | null, quote: number }> {
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

          return of({ currencyFormat: baseCurrency.format, quote: 1 });
        }

        const currencyRecord = x.marketSettings.currencies.portfolioCurrencies.find(c => c.exchangeInstrument?.symbol === currencyInstrument);
        if (!currencyRecord) {
          return NEVER;
        }

        return this.quotes.getQuotes(currencyRecord.exchangeInstrument!.symbol, currencyRecord.exchangeInstrument!.exchange ?? x.marketSettings.currencies.defaultCurrencyExchange)
          .pipe(
            map(quote => ({ currencyFormat: currencyRecord.format, quote: quote.last_price }))
          );
      })
    );
  }

  private formatCommonSummary(summary: CommonSummaryModel, currencyFormat: CurrencyFormat | null, exchangeRate: number): CommonSummaryView {
    return ({
      buyingPowerAtMorning: formatCurrency(summary.buyingPowerAtMorning / exchangeRate, this.locale, currencyFormat),
      buyingPower: formatCurrency(summary.buyingPower / exchangeRate, this.locale, currencyFormat),
      profit: formatCurrency(summary.profit / exchangeRate, this.locale, currencyFormat),
      profitRate: summary.profitRate,
      portfolioEvaluation: formatCurrency(summary.portfolioEvaluation / exchangeRate, this.locale, currencyFormat),
      portfolioLiquidationValue: formatCurrency(summary.portfolioLiquidationValue / exchangeRate, this.locale, currencyFormat),
      initialMargin: formatCurrency(summary.initialMargin / exchangeRate, this.locale, currencyFormat),
      correctedMargin: formatCurrency(summary.correctedMargin / exchangeRate, this.locale, currencyFormat),
      riskBeforeForcePositionClosing: formatCurrency(summary.riskBeforeForcePositionClosing / exchangeRate, this.locale, currencyFormat),
      commission: formatCurrency(summary.commission / exchangeRate, this.locale, currencyFormat),
    });
  }

  private formatForwardRisks(forwardRisks: ForwardRisks, risks: Risks, currencyFormat: CurrencyFormat | null, exchangeRate: number): ForwardRisksView {
    return {
      moneyFree: formatCurrency(forwardRisks.moneyFree / exchangeRate, this.locale, currencyFormat),
      moneyBlocked: formatCurrency(forwardRisks.moneyBlocked / exchangeRate, this.locale, currencyFormat),
      fee: formatCurrency(forwardRisks.fee / exchangeRate, this.locale, currencyFormat),
      moneyOld: formatCurrency(forwardRisks.moneyOld / exchangeRate, this.locale, currencyFormat),
      moneyAmount: formatCurrency(forwardRisks.moneyAmount / exchangeRate, this.locale, currencyFormat),
      moneyPledgeAmount: formatCurrency(forwardRisks.moneyPledgeAmount / exchangeRate, this.locale, currencyFormat),
      vmInterCl: formatCurrency(forwardRisks.vmInterCl / exchangeRate, this.locale, currencyFormat),
      vmCurrentPositions: formatCurrency(forwardRisks.vmCurrentPositions / exchangeRate, this.locale, currencyFormat),
      varMargin: formatCurrency(forwardRisks.varMargin / exchangeRate, this.locale, currencyFormat),
      isLimitsSet: forwardRisks.isLimitsSet,
      indicativeVarMargin: formatCurrency(forwardRisks.indicativeVarMargin / exchangeRate, this.locale, currencyFormat),
      netOptionValue: forwardRisks.netOptionValue,
      posRisk:formatCurrency(forwardRisks.posRisk / exchangeRate, this.locale, currencyFormat),
      portfolioLiquidationValue: formatCurrency(risks.portfolioLiquidationValue / exchangeRate, this.locale, currencyFormat),
      initialMargin: formatCurrency(risks.initialMargin / exchangeRate, this.locale, currencyFormat),
      minimalMargin: formatCurrency(risks.minimalMargin / exchangeRate, this.locale, currencyFormat),
      correctedMargin: formatCurrency(risks.correctedMargin / exchangeRate, this.locale, currencyFormat),
      riskCoverageRatioOne: formatCurrency(risks.riskCoverageRatioOne / exchangeRate, this.locale, currencyFormat),
      riskCoverageRatioTwo: formatCurrency(risks.riskCoverageRatioTwo / exchangeRate, this.locale, currencyFormat),
      riskStatus: risks.riskStatus,
      clientType: risks.clientType,
      portfolioEvaluation: formatCurrency((forwardRisks.moneyAmount + forwardRisks.varMargin - forwardRisks.fee) / exchangeRate , this.locale, currencyFormat),
    };
  }
}

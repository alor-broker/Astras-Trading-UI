import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class PortfolioSummaryService {
  constructor(
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly marketService: MarketService,
    private readonly quotes: QuotesService,
  ) {
  }

  getCommonSummary(portfolioKey: PortfolioKey): Observable<CommonSummaryView> {
    return combineLatest([
      this.portfolioSubscriptionsService.getSummariesSubscription(portfolioKey.portfolio, portfolioKey.exchange),
      this.getExchangeRate(portfolioKey.portfolio, portfolioKey.exchange)
    ]).pipe(
      map(([summary, quoteData]) => this.formatCommonSummary(summary, quoteData.currencyFormat, quoteData.quote))
    );
  }

  getForwardRisks(portfolioKey: PortfolioKey): Observable<ForwardRisksView> {
    return combineLatest([
      this.portfolioSubscriptionsService.getSpectraRisksSubscription(portfolioKey.portfolio, portfolioKey.exchange),
      this.getExchangeRate(portfolioKey.portfolio, portfolioKey.exchange)
    ]).pipe(
      map(([risks, quoteData]) => this.formatForwardRisks(risks, quoteData.currencyFormat, quoteData.quote))
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
      buyingPowerAtMorning: formatCurrency(summary.buyingPowerAtMorning / exchangeRate, currencyFormat),
      buyingPower: formatCurrency(summary.buyingPower / exchangeRate, currencyFormat),
      profit: formatCurrency(summary.profit / exchangeRate, currencyFormat),
      profitRate: summary.profitRate,
      portfolioEvaluation: formatCurrency(summary.portfolioEvaluation / exchangeRate, currencyFormat),
      portfolioLiquidationValue: formatCurrency(summary.portfolioLiquidationValue / exchangeRate, currencyFormat),
      initialMargin: formatCurrency(summary.initialMargin / exchangeRate, currencyFormat),
      correctedMargin: formatCurrency(summary.correctedMargin / exchangeRate, currencyFormat),
      riskBeforeForcePositionClosing: formatCurrency(summary.riskBeforeForcePositionClosing / exchangeRate, currencyFormat),
      commission: formatCurrency(summary.commission / exchangeRate, currencyFormat),
    });
  }

  private formatForwardRisks(risks: ForwardRisks, currencyFormat: CurrencyFormat | null, exchangeRate: number): ForwardRisksView {
    return {
      moneyFree: formatCurrency(risks.moneyFree / exchangeRate, currencyFormat),
      moneyBlocked: formatCurrency(risks.moneyBlocked / exchangeRate, currencyFormat),
      fee: formatCurrency(risks.fee / exchangeRate, currencyFormat),
      moneyOld: formatCurrency(risks.moneyOld / exchangeRate, currencyFormat),
      moneyAmount: formatCurrency(risks.moneyAmount / exchangeRate, currencyFormat),
      moneyPledgeAmount: formatCurrency(risks.moneyPledgeAmount / exchangeRate, currencyFormat),
      vmInterCl: formatCurrency(risks.vmInterCl / exchangeRate, currencyFormat),
      vmCurrentPositions: formatCurrency(risks.vmCurrentPositions / exchangeRate, currencyFormat),
      varMargin: formatCurrency(risks.varMargin / exchangeRate, currencyFormat),
      isLimitsSet: risks.isLimitsSet
    } as ForwardRisksView;
  }
}

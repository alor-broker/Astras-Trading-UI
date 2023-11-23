import {Injectable} from '@angular/core';
import {PortfolioKey} from "../models/portfolio-key.model";
import {combineLatest, Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {mapWith} from "../utils/observable-helper";
import {CurrencyInstrument} from "../models/enums/currencies.model";
import {CommonSummaryModel} from "../../modules/blotter/models/common-summary.model";
import {formatCurrency} from "../utils/formatters";
import {ForwardRisks} from "../../modules/blotter/models/forward-risks.model";
import {MarketService} from "./market.service";
import {PortfolioSubscriptionsService} from "./portfolio-subscriptions.service";
import {QuotesService} from "./quotes.service";
import {CommonSummaryView} from "../models/common-summary-view.model";
import {ForwardRisksView} from "../models/forward-risks-view.model";
import {TerminalSettingsService} from "./terminal-settings.service";

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
      map(([summary, quoteData]) => this.formatCommonSummary(summary, quoteData.currency, quoteData.quote))
    );
  }

  getForwardRisks(portfolioKey: PortfolioKey): Observable<ForwardRisksView> {
    return combineLatest([
      this.portfolioSubscriptionsService.getSpectraRisksSubscription(portfolioKey.portfolio, portfolioKey.exchange),
      this.getExchangeRate(portfolioKey.portfolio, portfolioKey.exchange)
    ]).pipe(
      map(([risks, quoteData]) => this.formatForwardRisks(risks, quoteData.currency, quoteData.quote))
    );
  }

  private getExchangeRate(portfolio: string, exchange: string): Observable<{ currency: string, quote: number }> {
    return this.terminalSettingsService.getSettings()
      .pipe(
        mapWith(
          () => this.marketService.getExchangeSettings(exchange),
          (settings, exchangeSettings) => ({settings, exchangeSettings})
        ),
        switchMap(({settings, exchangeSettings}) => {
          const portfolioCurrency = settings.portfoliosCurrency?.find(pc =>
            pc.portfolio.portfolio === portfolio && pc.portfolio.exchange === exchange
          );

          const currency = portfolioCurrency?.currency ?? exchangeSettings.currencyInstrument;

          if (currency === CurrencyInstrument.RUB) {
            return of({currency, quote: 1});
          }

          return this.quotes.getQuotes(currency, 'MOEX')
            .pipe(
              map(quote => ({currency, quote: quote.last_price}))
            );
        })
      );
  }

  private formatCommonSummary(summary: CommonSummaryModel, currency: string, exchangeRate: number): CommonSummaryView {
    return ({
      buyingPowerAtMorning: formatCurrency(summary.buyingPowerAtMorning / exchangeRate, currency),
      buyingPower: formatCurrency(summary.buyingPower / exchangeRate, currency),
      profit: formatCurrency(summary.profit / exchangeRate, currency),
      profitRate: summary.profitRate,
      portfolioEvaluation: formatCurrency(summary.portfolioEvaluation / exchangeRate, currency),
      portfolioLiquidationValue: formatCurrency(summary.portfolioLiquidationValue / exchangeRate, currency),
      initialMargin: formatCurrency(summary.initialMargin / exchangeRate, currency),
      riskBeforeForcePositionClosing: formatCurrency(summary.riskBeforeForcePositionClosing / exchangeRate, currency),
      commission: formatCurrency(summary.commission / exchangeRate, currency),
    });
  }

  private formatForwardRisks(risks: ForwardRisks, currency: string, exchangeRate: number): ForwardRisksView {
    return {
      moneyFree: formatCurrency(risks.moneyFree / exchangeRate, currency),
      moneyBlocked: formatCurrency(risks.moneyBlocked / exchangeRate, currency),
      fee: formatCurrency(risks.fee / exchangeRate, currency),
      moneyOld: formatCurrency(risks.moneyOld / exchangeRate, currency),
      moneyAmount: formatCurrency(risks.moneyAmount / exchangeRate, currency),
      moneyPledgeAmount: formatCurrency(risks.moneyPledgeAmount / exchangeRate, currency),
      vmInterCl: formatCurrency(risks.vmInterCl / exchangeRate, currency),
      vmCurrentPositions: formatCurrency(risks.vmCurrentPositions / exchangeRate, currency),
      varMargin: formatCurrency(risks.varMargin / exchangeRate, currency),
      isLimitsSet: risks.isLimitsSet
    } as ForwardRisksView;
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { ExchangeRateService } from "../../services/exchange-rate.service";
import { map, Observable, combineLatest } from "rxjs";
import { ExchangeRate } from "../../models/exchange-rate.model";
import { finalize, startWith } from "rxjs/operators";
import { mapWith } from "../../../../shared/utils/observable-helper";

@Component({
  selector: 'ats-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.less'],
  providers: [ExchangeRateService]
})
export class ExchangeRateComponent implements OnInit {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  public exchangeRateData$!: Observable<{currencies: string[], data: {[key: string]: number}}>;

  constructor(
    private readonly exchangeRateService: ExchangeRateService
  ) {
  }

  ngOnInit() {
    this.exchangeRateData$ = this.exchangeRateService.getCurrencies()
      .pipe(
        mapWith(
          this.getExchangeRates,
            (currencies, rates, ) => ({
              currencies: Array.from(new Set([...currencies.map(item => item.firstCode), ...currencies.map(item => item.secondCode)])),
              data: rates.reduce((acc, curr) => {
                acc[`${curr.firstCode}_${curr.secondCode}`] = curr.last_price;
                return acc;
              }, {} as any)
            })
        ),
      );
  }

  getRateValue(firstCode: string, secondCode: string, data: {[key: string]: number}): string {
    if (firstCode === secondCode || (!data[`${firstCode}_${secondCode}`] && !data[`${secondCode}_${firstCode}`])) {
      return '-';
    }
    return (data[`${firstCode}_${secondCode}`] || 1/data[`${secondCode}_${firstCode}`])?.toFixed(4);
  }

  private getExchangeRates = (exchangeRates: ExchangeRate[]): Observable<{firstCode: string, secondCode: string, last_price: number}[]> => {
    return combineLatest(
      exchangeRates.map(item => this.exchangeRateService.getQuotes(
          item.symbolTom,
          'MOEX'
        )
        .pipe(
          map(quote => ({
            firstCode: item.firstCode,
            secondCode: item.secondCode,
            last_price: quote.last_price
          })),
          finalize(() => this.exchangeRateService.unsubscribe()),
          startWith({
            firstCode: item.firstCode,
            secondCode: item.secondCode,
            last_price: 0
          })
        )
      )
    );
  };
}

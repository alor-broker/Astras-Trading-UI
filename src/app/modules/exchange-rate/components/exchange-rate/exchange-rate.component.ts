import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ExchangeRateService} from "../../../../shared/services/exchange-rate.service";
import {BehaviorSubject, combineLatest, map, Observable} from "rxjs";
import {ExchangeRate} from "../../models/exchange-rate.model";
import {startWith} from "rxjs/operators";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {QuotesService} from '../../../../shared/services/quotes.service';
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";

@Component({
  selector: 'ats-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.less']
})
export class ExchangeRateComponent implements OnInit, OnDestroy {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  exchangeRateData$!: Observable<{ currencies: string[], data: { [key: string]: number } }>;
  readonly tableScroll$ = new BehaviorSubject<ContentSize | null>({width: 50, height: 50});

  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly quotesService: QuotesService
  ) {
  }

  ngOnInit() {
    this.exchangeRateData$ = this.exchangeRateService.getCurrencies()
      .pipe(
        mapWith(
          this.getExchangeRates,
          (currencies, rates,) => ({
            currencies: Array.from(new Set([...currencies.map(item => item.firstCode), ...currencies.map(item => item.secondCode)])),
            data: rates.reduce((acc, curr) => {
              acc[`${curr.firstCode}_${curr.secondCode}`] = curr.last_price;
              return acc;
            }, {} as any)
          })
        ),
      );
  }

  getRateValue(firstCode: string, secondCode: string, data: { [key: string]: number }): string {
    if (firstCode === secondCode || (!data[`${firstCode}_${secondCode}`] && !data[`${secondCode}_${firstCode}`])) {
      return '-';
    }
    return (data[`${firstCode}_${secondCode}`] || 1 / data[`${secondCode}_${firstCode}`])?.toFixed(4);
  }

  updateContainerSize(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      const width = Math.floor(x.contentRect.width);
      const height = Math.floor(x.contentRect.height);

      const tableHeader = x.target.querySelector('.ant-table-thead');
      const scrollHeight = Math.floor(height - (tableHeader?.clientHeight ?? 0));

      this.tableScroll$.next({
        width: width,
        height: scrollHeight
      });
    });
  }

  ngOnDestroy(): void {
    this.tableScroll$.complete();
  }

  private getExchangeRates = (exchangeRates: ExchangeRate[]): Observable<{
    firstCode: string,
    secondCode: string,
    last_price: number
  }[]> => {
    return combineLatest(
      exchangeRates.map(item => this.quotesService.getQuotes(
          item.symbolTom,
          'MOEX'
        )
          .pipe(
            map(quote => ({
              firstCode: item.firstCode,
              secondCode: item.secondCode,
              last_price: quote.last_price
            })),
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

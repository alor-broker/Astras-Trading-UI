import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { ExchangeRateService } from "../../services/exchange-rate.service";
import { map, merge, Observable, Subject, switchMap, takeUntil, tap } from "rxjs";
import { ExchangeRate } from "../../models/exchange-rate.model";
import { finalize } from "rxjs/operators";

@Component({
  selector: 'ats-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.less'],
  providers: [ExchangeRateService]
})
export class ExchangeRateComponent implements OnInit, OnDestroy {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  public exchangeRates: ExchangeRate[] = [];
  public currencies: string[] = [];
  public data: { [key: string]: number } = {};

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.exchangeRateService.getCurrencies()
      .pipe(
        tap(res => {
          this.currencies = Array.from(new Set([...res.map(item => item.firstCode), ...res.map(item => item.secondCode)]));
        }),
        switchMap(this.getExchangeRates),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.data[`${res.firstCode}_${res.secondCode}`] = res.last_price;
        this.cdr.detectChanges();
      });
  }

  valueChanged(value: number, dataProp: string) {
    this.data[dataProp] = value;
  }

  getRateValue(firstCode: string, secondCode: string): string {
    if (firstCode === secondCode || (!this.data[`${firstCode}_${secondCode}`] && !this.data[`${secondCode}_${firstCode}`])) {
      return '-';
    }
    return (this.data[`${firstCode}_${secondCode}`] || 1/this.data[`${secondCode}_${firstCode}`])?.toFixed(4);
  }

  private getExchangeRates = (exchangeRates: ExchangeRate[]): Observable<{firstCode: string, secondCode: string, last_price: number}> => {
    return merge(
      ...exchangeRates.map(item => this.exchangeRateService.getQuotes(
          item.symbolTom,
          'MOEX'
        )
        .pipe(
          map(quote => ({
            firstCode: item.firstCode,
            secondCode: item.secondCode,
            last_price: quote.last_price
          })),
          takeUntil(this.destroy$),
          finalize(() => this.exchangeRateService.unsubscribe())
        )
      )
    );
  };

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

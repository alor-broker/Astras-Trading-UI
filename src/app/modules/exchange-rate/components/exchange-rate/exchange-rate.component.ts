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
          this.currencies = Array.from(new Set([...res.map(item => item.cur1), ...res.map(item => item.cur2)]));
        }),
        switchMap(this.getExchangeRates),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.data[`${res.cur1}_${res.cur2}`] = res.last_price;
        this.cdr.detectChanges();
      });
  }

  valueChanged(value: number, dataProp: string) {
    this.data[dataProp] = value;
  }

  getRateValue(cur1: string, cur2: string): string {
    if (cur1 === cur2) {
      return '-';
    }
    return (this.data[`${cur1}_${cur2}`] || 1/this.data[`${cur2}_${cur1}`])?.toFixed(4);
  }

  private getExchangeRates = (exchangeRates: ExchangeRate[]): Observable<{cur1: string, cur2: string, last_price: number}> => {
    return merge(
      ...exchangeRates.map(item => this.exchangeRateService.getQuotes(
          item.symbol,
          item.exchange,
          item.instrumentGroup,
        )
        .pipe(
          map(quote => ({
            cur1: item.cur1,
            cur2: item.cur2,
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

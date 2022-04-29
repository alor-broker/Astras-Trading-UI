import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, Observable, Subject, switchMap, tap } from 'rxjs';
import { formatCurrency } from 'src/app/shared/utils/formatters';
import { Finance } from '../../../models/finance.model';
import { InfoService } from '../../../services/info.service';
import { distinct, map } from 'rxjs/operators';

@Component({
  selector: 'ats-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.less']
})
export class FinanceComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  columns = 1;
  finance$?: Observable<Finance>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  private isActivated$ = new Subject<boolean>();
  private currency = "RUB";

  constructor(private service: InfoService) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.finance$ = combineLatest([
        this.service.getExchangeInfo(),
        this.isActivated$
      ]
    ).pipe(
      filter(([, isActivated]) => isActivated),
      map(([exchangeInfo,]) => exchangeInfo),
      distinct(),
      tap(() => this.isLoading$.next(true)),
      switchMap(exchangeInfo => this.service.getFinance(exchangeInfo)),
      tap(() => this.isLoading$.next(false)),
      tap(f => this.currency = f.currency)
    );
  }

  format(number: number) {
    return formatCurrency(number, this.currency, 0);
  }

  formatCurrency(number: number) {
    return formatCurrency(number, this.currency, 0);
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.isActivated$.complete();
  }
}

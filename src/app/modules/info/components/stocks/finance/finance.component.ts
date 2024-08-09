import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, Observable, Subject, switchMap, tap } from 'rxjs';
import { Finance } from '../../../models/finance.model';
import { InfoService } from '../../../services/info.service';
import { distinct, map } from 'rxjs/operators';

@Component({
  selector: 'ats-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.less']
})
export class FinanceComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  columns = 1;
  finance$?: Observable<Finance | null>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  private readonly isActivated$ = new Subject<boolean>();
  private currency = "RUB";

  constructor(private readonly service: InfoService) {
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
      tap(f => this.currency = f?.currency ?? 'RUB')
    );
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.isActivated$.complete();
  }
}

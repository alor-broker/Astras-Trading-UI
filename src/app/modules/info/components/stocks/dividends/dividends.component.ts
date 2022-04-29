import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { Dividend } from '../../../models/dividend.model';
import { InfoService } from '../../../services/info.service';
import { distinct } from 'rxjs/operators';

@Component({
  selector: 'ats-dividends',
  templateUrl: './dividends.component.html',
  styleUrls: ['./dividends.component.less']
})
export class DividendsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  dividends$?: Observable<Dividend[]>;
  isLoading$ = new BehaviorSubject<boolean>(true);

  private isActivated$ = new Subject<boolean>();

  constructor(private service: InfoService) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.dividends$ = combineLatest([
        this.service.getExchangeInfo(),
        this.isActivated$
      ]
    ).pipe(
      filter(([, isActivated]) => isActivated),
      map(([exchangeInfo,]) => exchangeInfo),
      distinct(),
      tap(() => this.isLoading$.next(true)),
      switchMap(exchangeInfo => this.service.getDividends(exchangeInfo)),
      tap(() => this.isLoading$.next(false))
    );
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.isActivated$.complete();
  }
}

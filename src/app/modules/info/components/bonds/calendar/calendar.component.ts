import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, Observable, Subject, switchMap, tap } from 'rxjs';
import { Calendar } from '../../../models/calendar.model';
import { InfoService } from '../../../services/info.service';
import { distinct, map } from 'rxjs/operators';

@Component({
  selector: 'ats-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.less']
})
export class CalendarComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  calendar$?: Observable<Calendar>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  private isActivated$ = new Subject<boolean>();

  constructor(private service: InfoService) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.calendar$ = combineLatest([
        this.service.getExchangeInfo(),
        this.isActivated$
      ]
    ).pipe(
      filter(([, isActivated]) => isActivated),
      map(([exchangeInfo,]) => exchangeInfo),
      distinct(),
      tap(() => this.isLoading$.next(true)),
      switchMap(exchangeInfo => this.service.getCalendar(exchangeInfo)),
      tap(() => this.isLoading$.next(false))
    );
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.isActivated$.complete();
  }
}

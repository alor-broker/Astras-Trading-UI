import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, Observable, Subject, switchMap, tap } from 'rxjs';
import { Description } from '../../../models/description.model';
import { InfoService } from '../../../services/info.service';
import { distinct, map } from 'rxjs/operators';

@Component({
  selector: 'ats-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.less']
})
export class DescriptionComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  columns: number = 1;
  description$?: Observable<Description>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  private isActivated$ = new Subject<boolean>();

  constructor(private service: InfoService) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.description$ = combineLatest([
        this.service.getExchangeInfo(),
        this.isActivated$
      ]
    ).pipe(
      filter(([, isActivated]) => isActivated),
      map(([exchangeInfo,]) => exchangeInfo),
      distinct(),
      tap(() => this.isLoading$.next(true)),
      switchMap(exchangeInfo => this.service.getDescription(exchangeInfo)),
      tap(() => this.isLoading$.next(false))
    );
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.isActivated$.complete();
  }
}

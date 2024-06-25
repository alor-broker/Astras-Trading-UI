import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, Observable, Subject, switchMap, tap } from 'rxjs';
import { Description, FutureType } from '../../../models/description.model';
import { InfoService } from '../../../services/info.service';
import { distinct, map } from 'rxjs/operators';

@Component({
  selector: 'ats-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.less']
})
export class DescriptionComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;
  columns = 1;
  description$?: Observable<Description | null>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  private readonly isActivated$ = new Subject<boolean>();

  constructor(private readonly service: InfoService) {
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

  getFutureType(symbolCfi: string): FutureType {
    // FFXPSX - example CFI for future
    // see https://en.wikipedia.org/wiki/ISO_10962 for CFI code semantic.
    const futureTypeCode = symbolCfi[3];

    if (futureTypeCode === 'P') {
        return FutureType.Deliverable;
    }

    if (futureTypeCode === 'C') {
      return FutureType.Settlement;
    }

    return FutureType.NonDeliverable;
  }
}

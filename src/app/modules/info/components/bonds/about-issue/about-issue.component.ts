import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, Observable, Subject, switchMap, tap } from 'rxjs';
import { Issue } from '../../../models/issue.model';
import { InfoService } from '../../../services/info.service';
import { distinct, map } from 'rxjs/operators';

@Component({
  selector: 'ats-about-issue',
  templateUrl: './about-issue.component.html',
  styleUrls: ['./about-issue.component.less']
})
export class AboutIssueComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  issue$?: Observable<Issue>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  columns = 1;
  private isActivated$ = new Subject<boolean>();

  constructor(private service: InfoService) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.issue$ = combineLatest([
        this.service.getExchangeInfo(),
        this.isActivated$
      ]
    ).pipe(
      filter(([, isActivated]) => isActivated),
      map(([exchangeInfo,]) => exchangeInfo),
      distinct(),
      tap(() => this.isLoading$.next(true)),
      switchMap(exchangeInfo => this.service.getIssue(exchangeInfo)),
      tap(() => this.isLoading$.next(false))
    );
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.isActivated$.complete();
  }
}

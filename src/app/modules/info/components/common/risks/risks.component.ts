import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, takeUntil, combineLatest, filter, map, BehaviorSubject } from "rxjs";
import { RisksInfo } from "../../../models/risks.model";
import { InfoService } from "../../../services/info.service";

@Component({
  selector: 'ats-risks[guid]',
  templateUrl: './risks.component.html',
  styleUrls: ['./risks.component.less']
})
export class RisksComponent implements OnInit, OnDestroy {
  @Input() guid!: string;
  private isActivated$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<boolean>();
  risksInfo$?: Observable<RisksInfo>;

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  constructor(private service: InfoService) {
  }

  ngOnInit() {
    this.risksInfo$ = combineLatest([
      this.service.getRisksInfo(),
      this.isActivated$
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(([, isActivated]) => isActivated),
        map(([risks]) => risks),
      );
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.isActivated$.complete();
  }
}

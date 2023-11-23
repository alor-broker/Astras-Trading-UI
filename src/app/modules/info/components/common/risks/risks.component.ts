import {Component, DestroyRef, Input, OnDestroy, OnInit} from '@angular/core';
import { Observable, combineLatest, filter, map, BehaviorSubject } from "rxjs";
import { RisksInfo } from "../../../models/risks.model";
import { InfoService } from "../../../services/info.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-risks',
  templateUrl: './risks.component.html',
  styleUrls: ['./risks.component.less']
})
export class RisksComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;
  private readonly isActivated$ = new BehaviorSubject<boolean>(false);
  risksInfo$?: Observable<RisksInfo>;

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  constructor(
    private readonly service: InfoService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.risksInfo$ = combineLatest([
      this.service.getRisksInfo(),
      this.isActivated$
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(([, isActivated]) => isActivated),
        map(([risks]) => risks),
      );
  }

  ngOnDestroy(): void {
    this.isActivated$.complete();
  }
}

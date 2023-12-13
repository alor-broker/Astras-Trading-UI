import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  shareReplay,
  tap
} from "rxjs";
import { RisksInfo } from "../../../models/risks.model";
import { InfoService } from "../../../services/info.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DashboardContextService } from "../../../../../shared/services/dashboard-context.service";
import { switchMap } from "rxjs/operators";
import { PortfolioKey } from "../../../../../shared/models/portfolio-key.model";

@Component({
  selector: 'ats-risks',
  templateUrl: './risks.component.html',
  styleUrls: ['./risks.component.less']
})
export class RisksComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  guid!: string;
  risksInfo$!: Observable<RisksInfo | null>;
  currentPortfolio$!: Observable<PortfolioKey>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  private readonly isActivated$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly service: InfoService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.currentPortfolio$ = this.dashboardContextService.selectedPortfolio$;

    const riskInfoStream$ = this.currentPortfolio$.pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(p => this.service.getRisksInfo(p))
    );

    this.risksInfo$ = combineLatest(
      {
        isActivated: this.isActivated$,
        riskInfo: riskInfoStream$
      }
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(x => x.isActivated),
        map(x => x.riskInfo),
        tap(() => this.isLoading$.next(false)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
  }

  ngOnDestroy(): void {
    this.isActivated$.complete();
    this.isLoading$.complete();
  }
}

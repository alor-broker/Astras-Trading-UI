import {
  inject,
  Injectable
} from "@angular/core";
import {
  ActivatedRoute,
  Params
} from "@angular/router";
import {
  filter,
  map,
  Subject,
  switchMap,
  takeUntil
} from "rxjs";
import {DASHBOARD_CONTEXT_SERVICE} from '../../features/dashboard/services/dashboard-context-service.types';
import {Hook} from '../types/hook.types';
import {InstrumentsService} from '../../features/instruments/services/instruments.service';
import {SearchFilter} from '../../features/instruments/services/instruments-service.types';
import {DefaultBadge} from '../../features/instruments/constants/badges.constants';

interface RouterQueryParams extends Params {
  ticker?: string;
}

@Injectable()
export class InitQueryParamsHook implements Hook {
  destroy$ = new Subject<boolean>();

  private readonly route = inject(ActivatedRoute);

  private readonly currentDashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly instrumentsService = inject(InstrumentsService);

  onDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onInit(): void {
    this.route.queryParams
      .pipe(
        filter((params: RouterQueryParams) => params.ticker != null && !!params.ticker.length),
        switchMap((params: RouterQueryParams) => {
          const filter: SearchFilter = {limit: 1, query: ''};

          if (params.ticker?.includes(':') ?? false) {
            const parts = (params.ticker as string).split(':');
            filter.exchange = parts[0].toUpperCase();
            filter.query = parts[1];
            filter.instrumentGroup = parts[2]?.toUpperCase() ?? '';
          } else {
            filter.query = params.ticker!;
          }

          return this.instrumentsService.searchInstruments(filter);
        }),
        filter(i => i.length > 0),
        map(instruments => instruments[0]),
        takeUntil(this.destroy$)
      )
      .subscribe(i => {
        this.currentDashboardService.selectDashboardInstrument(i, DefaultBadge);
      });
  }
}

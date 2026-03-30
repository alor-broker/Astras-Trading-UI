import { Injectable, inject } from "@angular/core";
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
import { AreaHook } from "./area-hook-token";
import { DashboardContextService } from "../../dashboard-context.service";
import { InstrumentsService } from "../../../../modules/instruments/services/instruments.service";
import { SearchFilter } from "../../../../modules/instruments/models/search-filter.model";
import { defaultBadgeColor } from "../../../utils/instruments";

interface RouterQueryParams extends Params {
  ticker?: string;
}

@Injectable()
export class InitQueryParamsHook implements AreaHook {
  private readonly route = inject(ActivatedRoute);
  private readonly currentDashboardService = inject(DashboardContextService);
  private readonly instrumentsService = inject(InstrumentsService);

  destroy$ = new Subject<boolean>();

  onDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onInit(): void {
    this.route.queryParams
      .pipe(
        filter((params: RouterQueryParams) => params.ticker != null && !!params.ticker.length),
        switchMap((params: RouterQueryParams) => {
          const filter: SearchFilter = { limit: 1, query: '' };

          if (params.ticker?.includes(':') ?? false) {
            const parts = (params.ticker as string).split(':');
            filter.exchange = parts[0].toUpperCase();
            filter.query = parts[1];
            filter.instrumentGroup = parts[2]?.toUpperCase() ?? '';
          } else {
            filter.query = params.ticker!;
          }

          return this.instrumentsService.getInstruments(filter);
        }),
        filter(i => i.length > 0),
        map(instruments => instruments[0]),
        takeUntil(this.destroy$)
      )
      .subscribe(i => {
        this.currentDashboardService.selectDashboardInstrument(i, defaultBadgeColor);
      });
  }
}

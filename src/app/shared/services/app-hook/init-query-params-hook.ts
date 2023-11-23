import { AppHook } from "./app-hook-token";
import { Injectable } from "@angular/core";
import { DashboardContextService } from "../dashboard-context.service";
import { ActivatedRoute, Params } from "@angular/router";
import { Subject, takeUntil, filter, switchMap, map } from "rxjs";
import { InstrumentsService } from "../../../modules/instruments/services/instruments.service";
import { SearchFilter } from "../../../modules/instruments/models/search-filter.model";
import { defaultBadgeColor } from "../../utils/instruments";

interface RouterQueryParams extends Params {
  ticker?: string;
}

@Injectable()
export class InitQueryParamsHook implements AppHook {

  destroy$ = new Subject<boolean>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly currentDashboardService: DashboardContextService,
    private readonly instrumentsService: InstrumentsService
  ) {
  }

  onDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onInit(): void {
    this.route.queryParams
      .pipe(
        filter((params: RouterQueryParams) => !!(params.ticker ?? '')),
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
        filter(i => !!i.length),
        map(instruments => instruments[0]),
        takeUntil(this.destroy$)
      )
      .subscribe(i => {
        this.currentDashboardService.selectDashboardInstrument(i, defaultBadgeColor);
      });
  }
}

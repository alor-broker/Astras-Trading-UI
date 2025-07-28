import {
  Component,
  DestroyRef,
  OnInit,
  output
} from '@angular/core';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import {
  NewsListItem,
  NewsService
} from "../../../../shared/services/news.service";
import {
  Observable,
  switchMap,
  tap,
  timer
} from "rxjs";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { PositionsService } from "../../../../shared/services/positions.service";
import { map } from "rxjs/operators";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { NzSkeletonComponent } from "ng-zorro-antd/skeleton";
import { LetDirective } from "@ngrx/component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { isToday } from "date-fns";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
  selector: 'ats-news',
  imports: [
    NzEmptyComponent,
    NzSkeletonComponent,
    LetDirective,
    NzButtonComponent,
    TranslocoDirective
  ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.less'
})
export class NewsComponent implements OnInit {
  items$!: Observable<NewsListItem[]>;

  isLoading = true;

  readonly showMore = output();

  protected readonly displayRecordsCount = 5;

  private readonly refreshIntervalSec = 30;

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly newsService: NewsService,
    private readonly positionsService: PositionsService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.items$ = this.dashboardContextService.selectedPortfolio$.pipe(
      mapWith(
        () => timer(0, this.refreshIntervalSec * 1000),
        source => source
      ),
      tap(() => this.isLoading = true),
      switchMap(p => this.positionsService.getAllByPortfolio(p.portfolio, p.exchange)),
      switchMap(pos => {
        if (pos == null || pos.length === 0) {
          return [];
        }

        return this.newsService.getNews({
          limit: this.displayRecordsCount,
          symbols: pos.map(p => p.targetInstrument.symbol),
          includedKeywords: null,
          excludedKeywords: null
        }).pipe(
          map(r => {
            if (r == null) {
              return [];
            }

            return r.data;
          })
        );
      }),
      tap(() => this.isLoading = false),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
    }

    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
  }
}

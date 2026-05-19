import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  Observable,
  switchMap,
  tap,
} from "rxjs";
import {map} from "rxjs/operators";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {LetDirective} from "@ngrx/component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {isToday} from "date-fns";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {TranslocoDirective} from "@jsverse/transloco";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {
  NewsListItem,
  NewsService
} from '@terminal-core-lib/features/news/services/news.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {AllPositionsService} from '@terminal-core-lib/features/client-info/services/all-positions.service';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';

@Component({
  selector: 'ats-mobile-home-screen-news',
  imports: [
    NzEmptyComponent,
    NzSkeletonComponent,
    LetDirective,
    NzButtonComponent,
    TranslocoDirective
  ],
  templateUrl: './mobile-home-screen-news.html',
  styleUrl: './mobile-home-screen-news.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MobileHomeScreenNews implements OnInit {
  items$!: Observable<NewsListItem[]>;

  isLoading = true;

  readonly showMore = output();

  protected readonly destroyRef = inject(DestroyRef);

  protected readonly displayRecordsCount = 5;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly newsService = inject(NewsService);

  private readonly positionsService = inject(AllPositionsService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly refreshIntervalSec = 30;

  ngOnInit(): void {
    this.items$ = this.dashboardContextService.selectedPortfolio$.pipe(
      withRefresh(this.refreshIntervalSec * 1000, this.applicationStatusService.isActive$),
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

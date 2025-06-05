import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { NewsSection } from "../../models/news.model";
import {
  BehaviorSubject,
  distinctUntilChanged,
  interval,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from "rxjs";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NewsSettings } from "../../models/news-settings.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { PositionsService } from "../../../../shared/services/positions.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import {
  filter,
  startWith
} from "rxjs/operators";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TableConfig } from "../../../../shared/models/table-config.model";
import { LazyLoadingBaseTableComponent } from "../../../../shared/components/lazy-loading-base-table/lazy-loading-base-table.component";
import {
  NewsListItem,
  NewsService
} from "../../../../shared/services/news.service";
import { PagedResult } from "../../../../shared/models/paging-model";

interface NewsFilter {
  symbols?: string[];
}

interface NewsListState {
  filter: NewsFilter;
  isEndOfList: boolean;
  loadedItems: NewsListItem[];
  startPageCursor: string | null;
  endPageCursor: string | null;
}

@Component({
  selector: 'ats-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less'],
  standalone: false
})
export class NewsComponent extends LazyLoadingBaseTableComponent<NewsListItem, NewsFilter> implements OnInit, OnDestroy {
  @Input({required: true}) guid!: string;

  @Output() sectionChange = new EventEmitter<NewsSection>();

  readonly newsSectionEnum = NewsSection;

  selectedNewsListItem: NewsListItem | null = null;

  private readonly selectedSection$ = new BehaviorSubject<NewsSection>(NewsSection.All);

  private settings$!: Observable<NewsSettings>;

  constructor(
    private readonly newsService: NewsService,
    private readonly translatorService: TranslatorService,
    protected readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly positionsService: PositionsService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(widgetSettingsService, destroyRef);
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<NewsSettings>(this.guid)
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();

    this.createFiltersStream();
  }

  rowClick(newsItem: NewsListItem): void {
    this.selectedNewsListItem = newsItem;
  }

  scrolled(): void {
    this.scrolled$.next(null);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.selectedSection$.complete();
  }

  newsSectionChange(section: NewsSection): void {
    this.selectedSection$.next(section);
    this.sectionChange.emit(section);
  }

  protected initTableConfigStream(): Observable<TableConfig<NewsListItem>> {
    return this.translatorService.getTranslator('news').pipe(
      map((translate) => ({
          columns: [
            {
              id: 'header',
              name: 'header',
              displayName: translate(['newsColumn']),
              transformFn: (data: NewsListItem): string => {
                const date = new Date(data.publishDate);
                const displayDate = date.toDateString() == new Date().toDateString()
                  ? date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
                  : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;

                return `[${displayDate}] ${data.header}`;
              }
            } as BaseColumnSettings<NewsListItem>
          ]
        })
      )
    );
  }

  protected initTableDataStream(): Observable<NewsListItem[]> {
    const createLoadMoreStream = (state: NewsListState): Observable<NewsListState> => {
      return this.scrolled$.pipe(
        filter(() => state.loadedItems.length > 0 && !state.isEndOfList),
        withLatestFrom(this.isLoading$),
        filter(([, isLoading]) => !isLoading && state.endPageCursor != null),
        tap(() => this.isLoading$.next(true)),
        switchMap(() => {
          return this.newsService.getNews({
            symbols: state.filter.symbols ?? null,
            limit: this.loadingChunkSize,
            afterCursor: state.endPageCursor
          });
        }),
        map((result: PagedResult<NewsListItem[]> | null) => {
          if (result === null) {
            return state;
          }

          if (result.data.length === 0 || !result.hasNextPage) {
            state.isEndOfList = true;
          }

          state.loadedItems = [
            ...state.loadedItems,
            ...result.data
          ];

          state.endPageCursor = result.endCursor;

          return state;
        }),
        tap(() => this.isLoading$.next(false)),
        startWith(state)
      );
    };

    const createLoadUpdatesStream = (state: NewsListState): Observable<NewsListState> => {
      return this.settings$.pipe(
        take(1),
        map(s => s.refreshIntervalSec ?? 60),
        switchMap(refreshIntervalSec => interval(refreshIntervalSec * 1000)),
        switchMap(() => this.loadUpdates(state.startPageCursor, state.filter)),
        map(result => {
          state.loadedItems = [
            ...result.loadedItems,
            ...state.loadedItems,
          ];

          state.startPageCursor = result.startPageCursor;

          return state;
        }),
        startWith(state)
      );
    };

    return this.filters$.pipe(
      tap(() => this.isLoading$.next(true)),
      map(filter => ({
        filter,
        isEndOfList: false,
        loadedItems: [] as NewsListItem[],
        startPageCursor: null,
        endPageCursor: null
      } as NewsListState)),
      mapWith(
        state => this.newsService.getNews({
          symbols: state.filter.symbols ?? null,
          limit: this.loadingChunkSize
        }),
        (state, result) => {
          if (result == null) {
            return state;
          }

          state.loadedItems = result.data;
          state.isEndOfList = !result.hasNextPage;
          state.startPageCursor = result.startCursor;
          state.endPageCursor = result.endCursor;

          return state;
        }
      ),
      tap(() => this.isLoading$.next(false)),
      switchMap(state => {
        return merge(
          createLoadMoreStream(state),
          createLoadUpdatesStream(state)
        );
      }),
      map(state => state.loadedItems)
    );
  }

  private loadUpdates(startPageCursor: string | null, filter: NewsFilter): Observable<{
    loadedItems: NewsListItem[];
    startPageCursor: string | null;
  }> {
    let currentCursor: string | null = startPageCursor;
    let loadedItems: NewsListItem[] = [];
    const load = (): Observable<{ loadedItems: NewsListItem[], startPageCursor: string | null }> => {
      return this.newsService.getNews({
        symbols: filter.symbols ?? null,
        limit: this.loadingChunkSize,
        beforeCursor: currentCursor
      }).pipe(
        switchMap(result => {
          if (result == null) {
            return of({
              loadedItems,
              startPageCursor: currentCursor
            });
          }

          loadedItems = [
            ...result.data,
            ...loadedItems
          ];

          if (result.hasPreviousPage) {
            currentCursor = result.startCursor;
            return load();
          }

          return of({
            loadedItems,
            startPageCursor: result.startCursor ?? currentCursor
          });
        })
      );
    };

    return load();
  }

  private createFiltersStream(): void {
    this.selectedSection$.pipe(
      switchMap(section => {
        if (section === NewsSection.Symbol) {
          return this.settings$.pipe(
            map(s => s.symbol),
            distinctUntilChanged((previous, current) => previous === current),
            map(s => ({
              symbols: [s]
            } as NewsFilter))
          );
        }

        if (section === NewsSection.Portfolio) {
          return this.dashboardContextService.selectedPortfolio$
            .pipe(
              switchMap(p => this.positionsService.getAllByPortfolio(p.portfolio, p.exchange)),
              map(p => ({
                symbols: (p ?? []).map(i => i.targetInstrument.symbol)
              } as NewsFilter))
            );
        }

        return of({});
      }),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(f => this.filters$.next(f));
  }
}

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
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
} from "rxjs";
import {
  NzTabComponent,
  NzTabsComponent
} from "ng-zorro-antd/tabs";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {AsyncPipe} from '@angular/common';
import {LazyLoadingBaseTable} from '@terminal-core-lib/features/tables/components/lazy-loading-base-table/lazy-loading-base-table';
import {
  NewsFilters,
  NewsWidgetSettings
} from '@terminal-widgets-lib/widgets/news/widget-settings.types';
import {
  NewsListItem,
  NewsService
} from '@terminal-core-lib/features/news/services/news.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {NewsSection} from '@terminal-widgets-lib/widgets/news/types/news.types';
import {AllPositionsService} from '@terminal-core-lib/features/client-info/services/all-positions.service';
import {NavigationStackService} from '@terminal-core-lib/common/services/navigation-stack.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  filter,
  startWith
} from 'rxjs/operators';
import {TableConfig} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {CursorPagedResult} from '@terminal-core-lib/common/types/paging.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {NewsFilters as NewsFiltersComponent} from '@terminal-widgets-lib/widgets/news/components/news-filters/news-filters';
import {
  InfiniteScrollTable,
  TableDataRow
} from '@terminal-core-lib/features/tables/components/infinite-scroll-table/infinite-scroll-table';
import {NewsItemDialog} from '@terminal-widgets-lib/widgets/news/components/news-item-dialog/news-item-dialog';

interface NewsListState {
  filter: NewsFilters;
  isEndOfList: boolean;
  loadedItems: NewsListItem[];
  startPageCursor: string | null;
  endPageCursor: string | null;
}

@Component({
  selector: 'ats-news',
  templateUrl: './news.html',
  styleUrls: ['./news.less'],
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    NzTabsComponent,
    NzTabComponent,
    LetDirective,
    NzResizeObserverDirective,
    AsyncPipe,
    NewsFiltersComponent,
    InfiniteScrollTable,
    NewsItemDialog
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class News extends LazyLoadingBaseTable<NewsListItem, NewsFilters> implements AfterViewInit, OnInit, OnDestroy {
  readonly guid = input.required<string>();

  readonly sectionChange = output<NewsSection>();

  readonly tabSet = viewChild<NzTabsComponent>('tabSet');

  readonly newsSectionEnum = NewsSection;

  selectedNewsListItem: NewsListItem | null = null;

  allColumns = [
    {
      id: 'header',
      name: 'header',
      displayName: '',
      transformFn: (data: NewsListItem): string => {
        const date = new Date(data.publishDate);
        const displayDate = date.toDateString() == new Date().toDateString()
          ? date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
          : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;

        return `[${displayDate}] ${data.header}`;
      }
    }
  ];

  readonly selectedSection$ = new BehaviorSubject<NewsSection>(NewsSection.All);

  isAllFiltersVisible = false;

  isFiltersApplied$!: Observable<boolean>;

  protected settings$!: Observable<NewsWidgetSettings>;

  private readonly newsService = inject(NewsService);

  private readonly translatorService = inject(TranslatorService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly allPositionsService = inject(AllPositionsService);

  private readonly navigationStackService = inject(NavigationStackService);

  ngAfterViewInit(): void {
    this.selectedSection$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(selectedTab => {
      const tabSet = this.tabSet();
      if (
        selectedTab === NewsSection.Portfolio
        && tabSet != null
        && (tabSet.nzSelectedIndex ?? -1) !== 1) {
        setTimeout(() => tabSet.setSelectedIndex(1));
      }
    });
  }

  override ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<NewsWidgetSettings>(this.guid())
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();

    this.createFiltersStream();

    this.navigationStackService.currentState$.pipe(
      filter(state => state.widgetTarget.typeId === 'news'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      if (state.widgetTarget.parameters?.section === 'portfolio') {
        setTimeout(() => this.newsSectionChange(NewsSection.Portfolio), 250);
      }
    });
  }

  override rowClick(row: TableDataRow): void {
    this.selectedNewsListItem = row as NewsListItem;
  }

  onScrolled(): void {
    this.scrolled.set(new Date().getTime());
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.selectedSection$.complete();
  }

  newsSectionChange(section: NewsSection): void {
    this.selectedSection$.next(section);
    this.sectionChange.emit(section);
  }

  applyAllFilters(filters: NewsFilters | null): void {
    this.isAllFiltersVisible = false;
    this.settingsService.updateSettings<NewsWidgetSettings>(
      this.guid(),
      {
        allNewsFilters: filters
      }
    );
  }

  protected initTableConfigStream(): Observable<TableConfig<NewsListItem>> {
    return this.translatorService.getTranslator('news').pipe(
      map((translate) => ({
          columns: this.allColumns.map(col => ({
            ...col,
            displayName: translate(['columns', col.id, 'displayName'], {fallback: col.displayName})
          }))
        })
      )
    );
  }

  protected initTableDataStream(): Observable<NewsListItem[]> {
    const createLoadMoreStream = (state: NewsListState): Observable<NewsListState> => {
      return this.scrolledChanges$.pipe(
        filter(() => state.loadedItems.length > 0 && !state.isEndOfList),
        filter(() => !this.isLoading() && state.endPageCursor != null),
        tap(() => this.isLoading.set(true)),
        switchMap(() => {
          return this.newsService.getNews({
            symbols: state.filter.symbols ?? null,
            includedKeywords: state.filter.includedKeyWords,
            excludedKeywords: state.filter.excludedKeyWords,
            limit: this.loadingChunkSize,
            afterCursor: state.endPageCursor
          });
        }),
        map((result: CursorPagedResult<NewsListItem[]> | null) => {
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
        tap(() => this.isLoading.set(false)),
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
      tap(() => this.isLoading.set(true)),
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
          includedKeywords: state.filter.includedKeyWords,
          excludedKeywords: state.filter.excludedKeyWords,
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
      tap(() => this.isLoading.set(false)),
      switchMap(state => {
        return merge(
          createLoadMoreStream(state),
          createLoadUpdatesStream(state)
        );
      }),
      map(state => state.loadedItems)
    );
  }

  private loadUpdates(startPageCursor: string | null, filter: NewsFilters): Observable<{
    loadedItems: NewsListItem[];
    startPageCursor: string | null;
  }> {
    let currentCursor: string | null = startPageCursor;
    let loadedItems: NewsListItem[] = [];
    const load = (): Observable<{ loadedItems: NewsListItem[], startPageCursor: string | null }> => {
      return this.newsService.getNews({
        symbols: filter.symbols ?? null,
        includedKeywords: filter.includedKeyWords,
        excludedKeywords: filter.excludedKeyWords,
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
        if (section === NewsSection.All) {
          return this.settings$.pipe(
            map(s => s.allNewsFilters),
            distinctUntilChanged((previous, current) => previous === current),
            map(s => ({
              includedKeyWords: s?.includedKeyWords ?? [],
              excludedKeyWords: s?.excludedKeyWords ?? [],
              symbols: s?.symbols ?? [],
            } as NewsFilters))
          );
        }

        if (section === NewsSection.Symbol) {
          return this.settings$.pipe(
            map(s => s.symbol),
            distinctUntilChanged((previous, current) => previous === current),
            map(s => ({
              includedKeyWords: [],
              excludedKeyWords: [],
              symbols: [s]
            } as NewsFilters))
          );
        }

        if (section === NewsSection.Portfolio) {
          return this.dashboardContextService.selectedPortfolio$
            .pipe(
              switchMap(p => this.allPositionsService.getAllByPortfolio(p.portfolio, p.exchange)),
              map(p => ({
                includedKeyWords: [],
                excludedKeyWords: [],
                symbols: (p ?? []).map(i => i.targetInstrument.symbol)
              } as NewsFilters))
            );
        }

        return of({
          includedKeyWords: [],
          excludedKeyWords: [],
          symbols: []
        });
      }),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(f => this.filters$.next(f));

    this.isFiltersApplied$ = this.filters$.pipe(
      map(f => {
        return f.includedKeyWords.length > 0
          || f.excludedKeyWords.length > 0
          || f.symbols.length > 0;
      })
    );
  }
}

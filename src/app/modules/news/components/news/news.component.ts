import { AfterViewInit, Component, DestroyRef, input, OnDestroy, OnInit, output, viewChild, inject } from '@angular/core';
import {NewsSection} from "../../models/news.model";
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
import {TranslatorService} from "../../../../shared/services/translator.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {NewsFilters, NewsSettings} from "../../models/news-settings.model";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {PositionsService} from "../../../../shared/services/positions.service";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {filter, startWith} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {
  LazyLoadingBaseTableComponent
} from "../../../../shared/components/lazy-loading-base-table/lazy-loading-base-table.component";
import {NewsListItem, NewsService} from "../../../../shared/services/news.service";
import {PagedResult} from "../../../../shared/models/paging-model";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {NavigationStackService} from "../../../../shared/services/navigation-stack.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {
  InfiniteScrollTableComponent,
  TableDataRow
} from '../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component';
import {NewsDialogComponent} from '../news-dialog/news-dialog.component';
import {NewsFiltersComponent} from '../news-filters/news-filters.component';
import {AsyncPipe} from '@angular/common';

interface NewsListState {
  filter: NewsFilters;
  isEndOfList: boolean;
  loadedItems: NewsListItem[];
  startPageCursor: string | null;
  endPageCursor: string | null;
}

@Component({
  selector: 'ats-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less'],
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    NzTabsComponent,
    NzTabComponent,
    LetDirective,
    NzResizeObserverDirective,
    InfiniteScrollTableComponent,
    NewsDialogComponent,
    NewsFiltersComponent,
    AsyncPipe
  ]
})
export class NewsComponent extends LazyLoadingBaseTableComponent<NewsListItem, NewsFilters> implements AfterViewInit, OnInit, OnDestroy {
  private readonly newsService = inject(NewsService);
  private readonly translatorService = inject(TranslatorService);
  protected readonly widgetSettingsService: WidgetSettingsService;
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly positionsService = inject(PositionsService);
  private readonly navigationStackService = inject(NavigationStackService);
  protected readonly destroyRef: DestroyRef;

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

  protected settings$!: Observable<NewsSettings>;

  constructor() {
    const widgetSettingsService = inject(WidgetSettingsService);
    const destroyRef = inject(DestroyRef);

    super(widgetSettingsService, destroyRef);

    this.widgetSettingsService = widgetSettingsService;
    this.destroyRef = destroyRef;
  }

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

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<NewsSettings>(this.guid())
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

  rowClick(row: TableDataRow): void {
    this.selectedNewsListItem = row as NewsListItem;
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

  applyAllFilters(filters: NewsFilters | null): void {
    this.isAllFiltersVisible = false;
    this.widgetSettingsService.updateSettings<NewsSettings>(
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
      return this.scrolled$.pipe(
        filter(() => state.loadedItems.length > 0 && !state.isEndOfList),
        withLatestFrom(this.isLoading$),
        filter(([, isLoading]) => !isLoading && state.endPageCursor != null),
        tap(() => this.isLoading$.next(true)),
        switchMap(() => {
          return this.newsService.getNews({
            symbols: state.filter.symbols ?? null,
            includedKeywords: state.filter.includedKeyWords,
            excludedKeywords: state.filter.excludedKeyWords,
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
              switchMap(p => this.positionsService.getAllByPortfolio(p.portfolio, p.exchange)),
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

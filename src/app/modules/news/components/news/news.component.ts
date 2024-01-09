import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { NewsService } from "../../services/news.service";
import { ModalService } from "../../../../shared/services/modal.service";
import {
  NewsListItem,
  NewsSection
} from "../../models/news.model";
import {
  BehaviorSubject,
  distinctUntilChanged,
  interval,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from "rxjs";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NewsSettings } from "../../models/news-settings.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { PositionsService } from "../../../../shared/services/positions.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import {
  filter,
  startWith
} from "rxjs/operators";

interface NewsFilter {
  symbols: string[];
}

interface NewsListState {
  filter: NewsFilter | null;
  loadedHistoryItemsCount: number;
  isEndOfList: boolean;
  loadedItems: NewsListItem[];
}

@Component({
  selector: 'ats-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less']
})
export class NewsComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  guid!: string;
  @Output() sectionChange = new EventEmitter<NewsSection>();
  newsListItems$!: Observable<NewsListItem[]>;
  readonly contentSize$ = new BehaviorSubject<ContentSize>({ height: 0, width: 0 });
  tableConfig$?: Observable<TableConfig<NewsListItem>>;
  readonly newsSectionEnum = NewsSection;
  readonly isLoading$ = new BehaviorSubject(false);
  private readonly selectedSection$ = new BehaviorSubject<NewsSection>(NewsSection.All);
  private readonly scrolled$ = new Subject<void>();
  private readonly itemsCountPerRequest = 50;
  private settings$!: Observable<NewsSettings>;
  private newsFilter$!: Observable<NewsFilter | null>;

  constructor(
    private readonly newsService: NewsService,
    private readonly modalService: ModalService,
    private readonly translatorService: TranslatorService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly positionsService: PositionsService
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<NewsSettings>(this.guid).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.newsFilter$ = this.createFiltersStream();

    this.newsListItems$ = this.createNewsListItemsStream();

    this.tableConfig$ = this.translatorService.getTranslator('news').pipe(
      map((translate) => ({
          columns: [
            {
              id: 'header',
              name: 'header',
              displayName: translate(['newsColumn']),
              transformFn: (data: NewsListItem): string => {
                const date = new Date(data.publishDate);
                const displayDate = date.toDateString() == new Date().toDateString()
                  ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

                return `[${displayDate}] ${data.header}`;
              }
            }
          ]
        })
      )
    );
  }

  openNewsModal(newsItem: NewsListItem): void {
    this.modalService.openNewsModal(newsItem);
  }

  scrolled(): void {
    this.scrolled$.next();
  }

  ngOnDestroy(): void {
    this.contentSize$.complete();
    this.selectedSection$.complete();
    this.scrolled$.complete();
    this.isLoading$.complete();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  newsSectionChange(section: NewsSection): void {
    this.selectedSection$.next(section);
    this.sectionChange.emit(section);
  }

  private createNewsListItemsStream(): Observable<NewsListItem[]> {
    const createLoadMoreStream = (state: NewsListState): Observable<NewsListState> => {
      return this.scrolled$.pipe(
        filter(() => state.loadedItems.length > 0 && !state.isEndOfList),
        withLatestFrom(this.isLoading$),
        filter(([, isLoading]) => !isLoading),
        tap(() => this.isLoading$.next(true)),
        switchMap(() => this.loadNews(state)),
        map(items => {
          if (items.length === 0) {
            state.isEndOfList = true;
          }

          let newItems: NewsListItem[] = items;
          if (state.loadedItems.length > 0) {
            const existingItemIndex = items.findIndex(i => i.id === state.loadedItems[state.loadedItems.length - 1].id);
            if (existingItemIndex >= 0) {
              const nextIndex = existingItemIndex + 1;
              if (nextIndex < items.length) {
                newItems = items.slice(nextIndex);
              } else {
                newItems = [];
              }
            }
          }

          state.loadedHistoryItemsCount += newItems.length;
          state.loadedItems = [
            ...state.loadedItems,
            ...newItems
          ];

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
        switchMap(() => this.loadUpdates(state)),
        map(items => {
          state.loadedItems = [
            ...items,
            ...state.loadedItems,
          ];

          return state;
        }),
        startWith(state)
      );
    };

    return this.newsFilter$.pipe(
      tap(() => this.isLoading$.next(true)),
      map(filter => ({
        filter,
        loadedHistoryItemsCount: 0,
        isEndOfList: false,
        loadedItems: [] as NewsListItem[]
      } as NewsListState)),
      mapWith(
        state => this.loadNews(state),
        (state, items) => {
          state.loadedItems = items;
          state.loadedHistoryItemsCount = state.loadedItems.length;

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

  private loadNews(state: NewsListState): Observable<NewsListItem[]> {
    if (state.isEndOfList) {
      return of([]);
    }

    return this.newsService.getNews({
      symbols: state.filter?.symbols ?? null,
      limit: this.itemsCountPerRequest,
      offset: state.loadedHistoryItemsCount,
    }).pipe(
      take(1)
    );
  }

  private loadUpdates(state: NewsListState, limit = this.itemsCountPerRequest): Observable<NewsListItem[]> {
    return this.newsService.getNews({
      symbols: state.filter?.symbols ?? null,
      limit: limit,
      offset: 0,
    }).pipe(
      take(1),
      switchMap(items => {
        if (state.loadedItems.length === 0 || items.length === 0) {
          return of(items);
        }

        const existingItemIndex = items.findIndex(i => i.id === state.loadedItems[0].id);

        if (existingItemIndex < 0) {
          const newLimit = limit * 2;
          if (newLimit < 500) {
            return this.loadUpdates(state, newLimit);
          } else {
            return of(items);
          }
        }

        return of(items.slice(0, existingItemIndex));
      })
    );
  }

  private createFiltersStream(): Observable<NewsFilter | null> {
    return this.selectedSection$.pipe(
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
                symbols: (p ?? []).map(i => i.symbol)
              } as NewsFilter))
            );
        }

        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}

import {
  ChangeDetectorRef,
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { NewsService } from "../../services/news.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsListItem, NewsSection } from "../../models/news.model";
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  Subscription,
  switchMap,
} from "rxjs";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NewsSettings } from "../../models/news-settings.model";
import { filter } from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less']
})
export class NewsComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;
  @Output() sectionChange = new EventEmitter<NewsSection>();

  readonly contentSize$ = new BehaviorSubject<ContentSize>({ height: 0, width: 0 });
  public tableContainerHeight = 0;
  public tableContainerWidth = 0;
  public newsList: NewsListItem[] = [];
  public isLoading = false;
  public tableConfig$?: Observable<TableConfig<NewsListItem>>;
  public newsSectionEnum = NewsSection;

  private selectedSection = NewsSection.All;
  private newsSubscription?: Subscription;
  private newNewsSubscription?: Subscription;
  private readonly limit = 50;
  private isEndOfList = false;
  private pageNumber = 1;

  constructor(
    private readonly newsService: NewsService,
    private readonly modalService: ModalService,
    private readonly translatorService: TranslatorService,
    private readonly cdr: ChangeDetectorRef,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  public ngOnInit(): void {
    this.loadNews(true);
    this.contentSize$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.tableContainerHeight = (data.height as number | undefined) ?? 0;
        this.tableContainerWidth = (data.width as number | undefined) ?? 0;
        this.cdr.markForCheck();
      });

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

  public openNewsModal(newsItem: NewsListItem): void {
    this.modalService.openNewsModal(newsItem);
  }

  public scrolled(): void {
    this.pageNumber++;
    this.loadNews();
  }

  public ngOnDestroy(): void {
    this.contentSize$.complete();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  private loadNews(isNewList = false): void {
    if (this.isEndOfList && !isNewList) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.newsSubscription?.unsubscribe();
    this.newsSubscription = this.getNewsRequest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (isNewList) {
          this.newsList = res;
        }

        if (res.length > 0) {
          this.newsList = this.newsList.concat(res);
        }
        else {
          this.isEndOfList = true;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      });

    if (!isNewList) {
      return;
    }

    this.newNewsSubscription?.unsubscribe();
    this.newNewsSubscription = this.getNewNewsStream()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((data: NewsListItem[]) => {
          const existingNewsItemIndex = data.findIndex(item => item.id === this.newsList[0]?.id);
          return existingNewsItemIndex === -1 ? data : data.slice(0, existingNewsItemIndex);
        })
      )
      .subscribe(res => {
        this.newsList = [...res, ...this.newsList];
        this.cdr.markForCheck();
      });
  }

  newsSectionChange(section: NewsSection): void {
    this.selectedSection = section;
    this.sectionChange.emit(section);
    this.resetPosition();
    this.loadNews(true);
  }

  private resetPosition(): void {
    this.isEndOfList = false;
    this.pageNumber = 1;
    this.newsList = [];
    this.cdr.markForCheck();
  }

  private getNewsRequest(): Observable<NewsListItem[]> {
    const baseParams = {
      limit: this.limit,
      offset: (this.pageNumber - 1) * this.limit
    };

    switch (this.selectedSection) {
      case NewsSection.All:
        return this.newsService.getNews(baseParams);
      case NewsSection.Portfolio:
        return this.newsService.getNewsByPortfolio(baseParams);
      case NewsSection.Symbol:
        return this.widgetSettingsService.getSettings<NewsSettings>(this.guid)
          .pipe(
            filter(s => !!s.symbol),
            distinctUntilChanged((prev, curr) => prev.symbol === curr.symbol),
            switchMap(s => this.newsService.getNews({
              ...baseParams,
              symbols: [s.symbol]
            }))
          );
      default:
        return this.newsService.getNews(baseParams);
    }
  }

  private getNewNewsStream(): Observable<NewsListItem[]> {
    switch (this.selectedSection) {
      case NewsSection.All:
        return this.newsService.getNewNews();
      case NewsSection.Portfolio:
        return this.newsService.getNewNewsByPortfolio();
      case NewsSection.Symbol:
        return this.widgetSettingsService.getSettings<NewsSettings>(this.guid)
          .pipe(
            filter(s => !!s.symbol),
            distinctUntilChanged((prev, curr) => prev.symbol === curr.symbol),
            switchMap(s => this.newsService.getNewNews([s.symbol]))
          );
      default:
        return this.newsService.getNewNews();
    }
  }
}

import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NewsService } from "../../services/news.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsListItem } from "../../models/news.model";
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
  takeUntil
} from "rxjs";
import { DatePipe } from "@angular/common";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NewsSettings } from "../../models/news-settings.model";
import { filter } from "rxjs/operators";

enum NewsSection {
  All = 'all',
  Portfolio = 'portfolio',
  Symbol = 'symbol'
}

@Component({
  selector: 'ats-news[guid]',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less']
})
export class NewsComponent implements OnInit, OnDestroy {
  @Input() guid!: string;

  readonly contentSize$ = new BehaviorSubject<ContentSize>({ height: 0, width: 0 });
  public tableContainerHeight: number = 0;
  public tableContainerWidth: number = 0;
  public newsList: Array<NewsListItem> = [];
  public isLoading = false;
  public tableConfig$?: Observable<TableConfig<NewsListItem>>;
  public newsSectionEnum = NewsSection;

  private selectedSection = NewsSection.All;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private newsSubscription?: Subscription;
  private newNewsSubscription?: Subscription;
  private datePipe = new DatePipe('ru-RU');
  private limit = 50;
  private isEndOfList = false;
  private pageNumber = 1;

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private readonly translatorService: TranslatorService,
    private readonly cdr: ChangeDetectorRef,
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  public ngOnInit(): void {
    this.loadNews(true);
    this.contentSize$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.tableContainerHeight = data.height ?? 0;
        this.tableContainerWidth = data.width ?? 0;
        this.cdr.markForCheck();
      });

    this.tableConfig$ = this.translatorService.getTranslator('news').pipe(
      map((translate) => ({
          columns: [
            {
              name: 'header',
              displayName: translate(['newsColumn']),
              transformFn: (data: NewsListItem) => `${this.datePipe.transform(data.publishDate, '[HH:mm]')} ${data.header}`
            }
          ]
        })
      )
    );
  }

  public openNewsModal(newsItem: NewsListItem): void {
    this.modalService.openNewsModal(newsItem);
  }

  public scrolled() {
    this.pageNumber++;
    this.loadNews();
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.contentSize$.complete();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]) {
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
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (isNewList) {
          this.newsList = res;
        }

        if (res.length) {
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
        takeUntil(this.destroy$),
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

  newsSectionChange(section: NewsSection) {
    this.selectedSection = section;
    this.loadNews(true);
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
            filter(s => !!s && !!s.symbol),
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
            filter(s => !!s && !!s.symbol),
            distinctUntilChanged((prev, curr) => prev.symbol === curr.symbol),
            switchMap(s => this.newsService.getNewNews([s.symbol]))
          );
      default:
        return this.newsService.getNewNews();
    }
  }
}

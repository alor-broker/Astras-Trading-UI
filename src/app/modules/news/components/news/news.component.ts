import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NewsService } from "../../services/news.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsListItem } from "../../models/news.model";
import {
  BehaviorSubject,
  map,
  Observable,
  of,
  Subject,
  takeUntil
} from "rxjs";
import { DatePipe } from "@angular/common";
import { ColumnsSettings } from "../../../../shared/models/columns-settings.model";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';

@Component({
  selector: 'ats-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less']
})
export class NewsComponent implements OnInit, OnDestroy {
  readonly contentSize$ = new BehaviorSubject<ContentSize>({ height: 0, width: 0 });
  public tableContainerHeight: number = 0;
  public tableContainerWidth: number = 0;
  public newsList: Array<NewsListItem> = [];
  public isLoading = false;
  public columns$: Observable<ColumnsSettings[]> = of([]);
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private datePipe = new DatePipe('ru-RU');
  private limit = 50;
  private isEndOfList = false;
  private pageNumber = 1;

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private readonly translatorService: TranslatorService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  public ngOnInit(): void {
    this.loadNews();
    this.contentSize$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.tableContainerHeight = data.height ?? 0;
        this.tableContainerWidth = data.width ?? 0;
        this.cdr.markForCheck();
      });

    this.columns$ = this.translatorService.getTranslator('news').pipe(
      map((translate) => ([
          {
            name: 'header',
            displayName: translate(['newsColumn']),
            transformFn: (data: NewsListItem) => `${this.datePipe.transform(data.publishDate, '[HH:mm]')} ${data.header}`
          }
        ])
      )
    );


    this.newsService.getNewNews()
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

  private loadNews(): void {
    if (this.isEndOfList) return;

    this.isLoading = true;
    this.cdr.markForCheck();
    this.newsService.getNews({
      limit: this.limit,
      offset: (this.pageNumber - 1) * this.limit
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res.length) {
          this.newsList = this.newsList.concat(res);
        }
        else {
          this.isEndOfList = true;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}

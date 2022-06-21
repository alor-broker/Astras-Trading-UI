import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { NewsService } from "../../services/news.service";
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsListItem } from "../../models/news.model";
import { map, Subject, takeUntil } from "rxjs";
import { DatePipe } from "@angular/common";
import { ColumnsSettings } from "../../../../shared/models/columns-settings.model";

@Component({
  selector: 'ats-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less']
})
export class NewsComponent implements OnInit, OnDestroy {

  @Input() public resize!: EventEmitter<DashboardItem>;
  @Input() public heightAdjustment!: number;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private datePipe = new DatePipe('ru-RU');
  private limit = 50;
  private isEndOfList = false;
  private pageNumber = 1;

  public tableContainerHeight: number = 0;
  public tableContainerWidth: number = 0;
  public newsList: Array<NewsListItem> = [];
  public isLoading = false;

  public columns: ColumnsSettings[] = [
    {
      name: 'publishDate',
      displayName: 'Время',
      transformFn: (data: string) => this.datePipe.transform(data, 'dd.MM.yyyy HH:mm:ss'),
      width: '135px'
    },
    {name: 'header', displayName: 'Новость'},
  ];

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.loadNews();
    this.resize
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
      this.tableContainerHeight = data.height! - this.heightAdjustment;
      this.tableContainerWidth = data.width!;
      this.cdr.markForCheck();
    });

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
        } else {
          this.isEndOfList = true;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}

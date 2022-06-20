import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { NewsService } from "../../services/news.service";
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsListItem } from "../../models/news.model";
import { Subject, takeUntil } from "rxjs";
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
  private take = 50;
  private isEndOfList = false;
  private pageNumber = 1;

  public tableContainerHeight: number = 0;
  public tableContainerWidth: number = 0;
  public newsList: Array<NewsListItem> = [];
  public isLoading = false;

  public columns: ColumnsSettings[] = [
    {name: 'publishDate', displayName: 'Время', transformFn: (data: string) => this.datePipe.transform(data, 'HH:mm:ss'), width: '20%'},
    {name: 'header', displayName: 'Новость', width: '80%'},
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

    // this.newsService.getNewNews()
    //   .subscribe(res => {
    //     this.newsList = [res, ...this.newsList];
    //     this.cdr.markForCheck();
    //   });
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
      limit: this.take,
      offset: (this.pageNumber - 1) * this.take
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

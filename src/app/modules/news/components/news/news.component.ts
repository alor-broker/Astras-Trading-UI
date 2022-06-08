import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, ViewChild } from '@angular/core';
import { NewsService } from "../../services/news.service";
import { NzTableComponent } from "ng-zorro-antd/table";
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsListItem } from "../../models/news.model";

@Component({
  selector: 'ats-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.less']
})
export class NewsComponent implements OnInit, AfterViewInit {

  @ViewChild('newsTable', {static: false}) newsTable!: NzTableComponent<NewsListItem>;
  @Input() public resize!: EventEmitter<DashboardItem>;

  private visibleItemsCount = 0;
  public newsList: NewsListItem[] = [];
  public scrollHeight = 0;
  public isLoading = false;

  constructor(
    private newsService: NewsService,
    private modalService: ModalService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.loadNews();
    this.resize.subscribe(data => {
      this.scrollHeight = data.height! - 66.5;
      this.visibleItemsCount = Math.ceil(this.scrollHeight / 29);
      this.cdr.markForCheck();
    });

    this.newsService.getNewsSub()
      .subscribe(res => {
        this.newsList = [res, ...this.newsList];
        this.cdr.markForCheck();
      });
  }

  public ngAfterViewInit(): void {
    this.newsTable?.cdkVirtualScrollViewport?.scrolledIndexChange
      .subscribe((upperItemIndex: number) => {
        if (
          !this.isLoading &&
          upperItemIndex >= this.newsList.length - this.visibleItemsCount - 1
        ) {
          this.loadNews();
        }
      });
  }

  public openNewsModal(newsId: number): void {
    this.modalService.openNewsModal(newsId);
  }

  public trackById(index: number, data: NewsListItem): number {
    return data.id;
  }

  private loadNews(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.newsService.getNews()
      .subscribe(res => {
        this.newsList = this.newsList.concat(res.list);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}

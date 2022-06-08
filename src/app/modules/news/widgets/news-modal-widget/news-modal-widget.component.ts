import { Component, OnInit } from '@angular/core';
import { Observable, of, switchMap } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsService } from "../../services/news.service";
import { NewsItemInfo } from "../../models/news.model";

@Component({
  selector: 'ats-news-modal-widget',
  templateUrl: './news-modal-widget.component.html',
  styleUrls: ['./news-modal-widget.component.less']
})
export class NewsModalWidgetComponent implements OnInit {

  isVisible$: Observable<boolean> = of(false);
  newsInfo$: Observable<NewsItemInfo | null> = of(null);

  constructor(
    private modalService: ModalService,
    private newsService: NewsService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowNewsModal$;
    this.newsInfo$ = this.modalService.newsId$.pipe(
      switchMap(id => this.newsService.getNewsItemInfo(id))
    );
  }

  handleCancel() {
    this.modalService.closeNewsModal();
  }
}

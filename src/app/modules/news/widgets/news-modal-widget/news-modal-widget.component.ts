import { Component, OnInit } from '@angular/core';
import { Observable, of } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { NewsListItem } from "../../models/news.model";

@Component({
  selector: 'ats-news-modal-widget',
  templateUrl: './news-modal-widget.component.html',
  styleUrls: ['./news-modal-widget.component.less']
})
export class NewsModalWidgetComponent implements OnInit {

  isVisible$: Observable<boolean> = of(false);
  newsInfo$: Observable<NewsListItem | null> = of(null);

  constructor(
    private modalService: ModalService,
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowNewsModal$;
    this.newsInfo$ = this.modalService.newsItem$;
  }

  handleCancel() {
    this.modalService.closeNewsModal();
  }
}

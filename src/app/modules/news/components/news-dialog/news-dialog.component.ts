import {Component, Input} from '@angular/core';
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";
import {NewsListItem} from "../../../../shared/services/news.service";

@Component({
  selector: 'ats-news-dialog',
  templateUrl: './news-dialog.component.html',
  styleUrls: ['./news-dialog.component.less'],
  imports: [
    NzModalComponent,
    NzModalContentDirective
  ],
  standalone: true
})
export class NewsDialogComponent {
  @Input({required: true})
  newsItem: NewsListItem | null = null;

  handleCancel(): void {
    this.newsItem = null;
  }
}

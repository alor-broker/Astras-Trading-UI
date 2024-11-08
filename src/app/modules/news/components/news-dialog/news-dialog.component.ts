import {Component, Input} from '@angular/core';
import {NewsListItem} from "../../models/news.model";
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";

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

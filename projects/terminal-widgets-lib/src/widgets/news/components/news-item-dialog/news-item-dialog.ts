import {
  ChangeDetectionStrategy,
  Component,
  model,
  ViewEncapsulation
} from '@angular/core';
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import {NewsListItem} from '@terminal-core-lib/features/news/services/news.service';

@Component({
  selector: 'ats-news-item-dialog',
  templateUrl: './news-item-dialog.html',
  styleUrls: ['./news-item-dialog.less'],
  imports: [
    NzModalComponent,
    NzModalContentDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NewsItemDialog {
  readonly newsItem = model<NewsListItem | null>(null);

  handleCancel(): void {
    this.newsItem.set(null);
  }
}

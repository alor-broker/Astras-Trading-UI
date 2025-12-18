import {
  Component,
  Input,
  TemplateRef
} from '@angular/core';
import { NgTemplateOutlet, NgClass } from '@angular/common';

@Component({
    selector: 'ats-widget-skeleton',
    templateUrl: './widget-skeleton.component.html',
    styleUrls: ['./widget-skeleton.component.less'],
    imports: [NgTemplateOutlet, NgClass]
})
export class WidgetSkeletonComponent {
  @Input({required: true})
  header!: TemplateRef<any>;

  @Input({required: true})
  content!: TemplateRef<any>;

  @Input()
  settings?: TemplateRef<any>;

  @Input()
  showSettings = false;

  @Input({required: true})
  isBlockWidget!: boolean;

  @Input()
  showContentScroll = false;
}

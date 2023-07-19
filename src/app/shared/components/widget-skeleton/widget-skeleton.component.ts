import {
  Component,
  Input,
  TemplateRef
} from '@angular/core';

@Component({
  selector: 'ats-widget-skeleton',
  templateUrl: './widget-skeleton.component.html',
  styleUrls: ['./widget-skeleton.component.less']
})
export class WidgetSkeletonComponent {
  @Input({required: true})
  header!: TemplateRef<any>;

  @Input({required: true})
  content!: TemplateRef<any>;

  @Input()
  settings?: TemplateRef<any>;

  @Input()
  showSettings: boolean = false;

  @Input({required: true})
  isBlockWidget!: boolean;

  @Input()
  showContentScroll = false;
  constructor() {
  }

}

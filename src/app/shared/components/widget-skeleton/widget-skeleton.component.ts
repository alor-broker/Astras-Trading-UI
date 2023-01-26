import {
  Component,
  Input,
  TemplateRef
} from '@angular/core';

@Component({
  selector: 'ats-widget-skeleton[header][content][isBlockWidget]',
  templateUrl: './widget-skeleton.component.html',
  styleUrls: ['./widget-skeleton.component.less']
})
export class WidgetSkeletonComponent {
  @Input()
  header!: TemplateRef<any>;

  @Input()
  content!: TemplateRef<any>;

  @Input()
  settings?: TemplateRef<any>;

  @Input()
  showSettings: boolean = false;

  @Input()
  isBlockWidget!: boolean;

  @Input()
  showContentScroll = false;
  constructor() {
  }

}

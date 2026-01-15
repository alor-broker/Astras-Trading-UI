import {Component, input, TemplateRef} from '@angular/core';
import {NgClass, NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'ats-widget-skeleton',
  templateUrl: './widget-skeleton.component.html',
  styleUrls: ['./widget-skeleton.component.less'],
  imports: [NgTemplateOutlet, NgClass]
})
export class WidgetSkeletonComponent {
  readonly header = input.required<TemplateRef<any>>();

  readonly content = input.required<TemplateRef<any>>();

  readonly settings = input<TemplateRef<any> | null>();

  readonly showSettings = input(false);

  readonly isBlockWidget = input.required<boolean>();

  readonly showContentScroll = input(false);
}

import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'ats-widget-skeleton',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './widget-skeleton.html',
  styleUrl: './widget-skeleton.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSkeleton {
  readonly header = input.required<TemplateRef<any>>();

  readonly content = input.required<TemplateRef<any>>();

  readonly settings = input<TemplateRef<any> | null>();

  readonly showSettings = input(false);

  readonly isBlockWidget = input.required<boolean>();

  readonly showContentScroll = input(false);
}

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
  readonly header = input.required<TemplateRef<unknown>>();

  readonly content = input.required<TemplateRef<unknown>>();

  readonly settings = input<TemplateRef<unknown> | null>();

  readonly showSettings = input(false);

  readonly isBlockWidget = input.required<boolean>();

  readonly showContentScroll = input(false);
}

import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {MarkdownComponent} from 'ngx-markdown';
import {SignalSection} from '../signal-section/signal-section';

@Component({
  selector: 'ats-signal-news-summary',
  imports: [
    SignalSection,
    TranslocoDirective,
    MarkdownComponent
  ],
  templateUrl: './signal-news-summary.html',
  styleUrl: './signal-news-summary.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalNewsSummary {
  readonly summary = input.required<string>();

  readonly periodDays = input<number | null>(null);
}

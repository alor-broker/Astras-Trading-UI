import {ChangeDetectionStrategy, Component, input, ViewEncapsulation} from '@angular/core';
import {IdeaStructuredResponse} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  selector: 'ats-idea-metrics',
  imports: [
    TranslocoDirective
  ],
  templateUrl: './idea-metrics.html',
  styleUrl: './idea-metrics.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaMetrics {
  readonly idea = input.required<IdeaStructuredResponse>();
}

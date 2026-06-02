import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-external-link',
  imports: [
    NzIconDirective
  ],
  templateUrl: './external-link.html',
  styleUrl: './external-link.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalLink {
  readonly klass = input<string>();

  readonly target = input<'_self' | '_blank'>('_blank');

  readonly rel = input('noopener noreferrer');

  readonly href = input<string | null | undefined>();
}

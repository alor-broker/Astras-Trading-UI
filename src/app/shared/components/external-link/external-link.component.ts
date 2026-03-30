import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";

@Component({
    selector: 'ats-external-link',
    templateUrl: './external-link.component.html',
    styleUrls: ['./external-link.component.less'],
    imports: [
        NzIconDirective
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalLinkComponent {
  readonly klass = input<string>();

  readonly target = input<'_self' | '_blank'>('_blank');

  readonly rel = input('noopener noreferrer');

  readonly href = input<string>();
}

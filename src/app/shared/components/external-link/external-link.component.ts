import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";

@Component({
  selector: 'ats-external-link',
  templateUrl: './external-link.component.html',
  styleUrls: ['./external-link.component.less'],
  imports: [
    NzIconDirective
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalLinkComponent {
  @Input()
  klass?: string;

  @Input()
  target: '_self' | '_blank' = '_blank';

  @Input()
  rel = 'noopener noreferrer';

  @Input()
  href?: string;
}

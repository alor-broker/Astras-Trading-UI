import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-external-link',
  templateUrl: './external-link.component.html',
  styleUrls: ['./external-link.component.less']
})
export class ExternalLinkComponent {
  @Input()
  klass?: string;
  @Input()
  target: '_self' | '_blank' = '_blank';

  @Input()
  rel: string = 'noopener noreferrer';

  @Input()
  href?: string;

  constructor() {
  }
}

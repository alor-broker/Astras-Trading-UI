import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {EXTERNAL_LINKS_CONFIG} from '../../../external-links/external-links.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {ExternalLink} from '../../../external-links/components/external-link/external-link';

@Component({
  selector: 'ats-useful-links',
  imports: [
    TranslocoDirective,
    NzRowDirective,
    NzColDirective,
    ExternalLink
  ],
  templateUrl: './useful-links.html',
  styleUrl: './useful-links.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsefulLinks {
  protected readonly externalLinksConfig = inject(EXTERNAL_LINKS_CONFIG);

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.length === 0;
  }
}

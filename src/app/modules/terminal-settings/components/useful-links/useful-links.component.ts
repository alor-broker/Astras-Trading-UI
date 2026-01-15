import { Component, inject } from '@angular/core';
import {EnvironmentService} from 'src/app/shared/services/environment.service';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {ExternalLinkComponent} from '../../../../shared/components/external-link/external-link.component';

@Component({
  selector: 'ats-useful-links',
  templateUrl: './useful-links.component.html',
  styleUrls: ['./useful-links.component.less'],
  imports: [
    TranslocoDirective,
    NzRowDirective,
    NzColDirective,
    ExternalLinkComponent
  ]
})
export class UsefulLinksComponent {
  private readonly environmentService = inject(EnvironmentService);

  readonly externalLinks = this.environmentService.externalLinks;

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.length === 0;
  }
}

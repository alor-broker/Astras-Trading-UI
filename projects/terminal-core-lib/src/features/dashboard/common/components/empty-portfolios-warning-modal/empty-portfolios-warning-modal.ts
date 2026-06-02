import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from 'rxjs';
import {EXTERNAL_LINKS_CONFIG} from '../../../../external-links/external-links.types';
import {HelpService} from '../../../../help-docs/services/help.service';
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from 'ng-zorro-antd/modal';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {ExternalLink} from '../../../../external-links/components/external-link/external-link';
import {AsyncPipe} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'ats-empty-portfolios-warning-modal',
  imports: [
    NzModalComponent,
    TranslocoDirective,
    NzTypographyComponent,
    NzModalContentDirective,
    NzModalContentDirective,
    ExternalLink,
    AsyncPipe,
    NzModalFooterDirective,
    NzButtonComponent
  ],
  templateUrl: './empty-portfolios-warning-modal.html',
  styleUrl: './empty-portfolios-warning-modal.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmptyPortfoliosWarningModal implements OnInit {
  helpLink$!: Observable<string | null>;

  readonly atsVisible = model(false);

  protected readonly externalLinksConfig = inject(EXTERNAL_LINKS_CONFIG);

  supportLink = this.externalLinksConfig.support;

  readonly videoTutorialLink = this.externalLinksConfig.videoTutorial;

  private readonly helpService = inject(HelpService);

  ngOnInit(): void {
    this.helpLink$ = this.helpService.getSectionHelp('main');
  }

  handleClose(): void {
    this.atsVisible.set(false);
  }
}

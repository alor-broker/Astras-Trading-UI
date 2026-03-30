import { Component, model, OnInit, inject } from '@angular/core';
import {Observable} from "rxjs";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {HelpService} from "../../../shared/services/help.service";
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from "ng-zorro-antd/modal";
import {AsyncPipe} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {ExternalLinkComponent} from "../../../shared/components/external-link/external-link.component";

@Component({
  selector: 'ats-empty-portfolios-warning-modal',
  imports: [
    NzModalComponent,
    AsyncPipe,
    TranslocoDirective,
    NzModalContentDirective,
    NzTypographyComponent,
    NzModalFooterDirective,
    NzButtonComponent,
    ExternalLinkComponent
  ],
  templateUrl: './empty-portfolios-warning-modal.component.html',
  styleUrl: './empty-portfolios-warning-modal.component.less'
})
export class EmptyPortfoliosWarningModalComponent implements OnInit {
  private readonly environmentService = inject(EnvironmentService);
  private readonly helpService = inject(HelpService);

  supportLink = this.environmentService.externalLinks?.support;
  helpLink$!: Observable<string | null>;

  readonly atsVisible = model(false);

  ngOnInit(): void {
    this.helpLink$ = this.helpService.getSectionHelp('main');
  }

  handleClose(): void {
    this.atsVisible.set(false);
  }
}

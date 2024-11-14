import {Component, Input, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {ModalService} from "../../../shared/services/modal.service";
import {HelpService} from "../../../shared/services/help.service";
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from "ng-zorro-antd/modal";
import {AsyncPipe} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {ExternalLinkComponent} from "../../../shared/components/external-link/external-link.component";

@Component({
  selector: 'ats-empty-portfolios-warning-modal',
  standalone: true,
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
  supportLink = this.environmentService.externalLinks.support;
  helpLink$!: Observable<string | null>;

  @Input({required: true})
  atsVisible = false;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly modalService: ModalService,
    private readonly helpService: HelpService
  ) {
  }

  ngOnInit(): void {
    this.helpLink$ = this.helpService.getHelpLink('main');
  }

  handleClose(): void {
    this.atsVisible = false;
  }
}

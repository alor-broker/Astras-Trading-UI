import { Component, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { HelpService } from "../../../../shared/services/help.service";

@Component({
  selector: 'ats-empty-portfolios-warning-modal-widget',
  templateUrl: './empty-portfolios-warning-modal-widget.component.html',
  styleUrls: ['./empty-portfolios-warning-modal-widget.component.less']
})
export class EmptyPortfoliosWarningModalWidgetComponent implements OnInit {
  supportLink = this.environmentService.externalLinks.support;
  helpLink$!: Observable<string | null>;

  isVisible$!: Observable<boolean>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly modalService: ModalService,
    private readonly helpService: HelpService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowEmptyPortfoliosWarningModal$;

    // all-instruments because it`s first in docs list
    this.helpLink$ = this.helpService.getHelpLink('main');
  }

  handleClose(): void {
    this.modalService.closeEmptyPortfoliosWarningModal();
  }
}

import { Component, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";

@Component({
  selector: 'ats-empty-portfolios-warning-modal-widget',
  templateUrl: './empty-portfolios-warning-modal-widget.component.html',
  styleUrls: ['./empty-portfolios-warning-modal-widget.component.less']
})
export class EmptyPortfoliosWarningModalWidgetComponent implements OnInit {
  supportLink = this.environmentService.externalLinks.support;
  helpLink = this.environmentService.externalLinks.help;

  isVisible$!: Observable<boolean>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly modalService: ModalService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowEmptyPortfoliosWarningModal$;
  }

  handleClose(): void {
    this.modalService.closeEmptyPortfoliosWarningModal();
  }
}

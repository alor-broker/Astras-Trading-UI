import { Component, OnInit } from '@angular/core';
import { environment } from "../../../../../environments/environment";
import { Observable } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";

@Component({
  selector: 'ats-empty-portfolios-warning-modal-widget',
  templateUrl: './empty-portfolios-warning-modal-widget.component.html',
  styleUrls: ['./empty-portfolios-warning-modal-widget.component.less']
})
export class EmptyPortfoliosWarningModalWidgetComponent implements OnInit {
  supportLink = environment.externalLinks.support;
  helpLink = environment.externalLinks.help;

  isVisible$!: Observable<boolean>;

  constructor(
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

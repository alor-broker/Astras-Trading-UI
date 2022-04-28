import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';

@Component({
  selector: 'ats-beta-reminder-widget',
  templateUrl: './beta-reminder-widget.component.html',
  styleUrls: ['./beta-reminder-widget.component.less']
})
export class BetaReminderWidgetComponent implements OnInit {
  private betaStorage = 'beta';
  isVisible$: Observable<boolean> = of(false);

  constructor(public readonly modal: ModalService) { }

  ngOnInit(): void {
    this.isVisible$ = this.modal.shouldShowBetaReminderModal$;
  }

  handleClose() {
    this.modal.closeBetaReminderModal();
    localStorage.setItem(this.betaStorage, 'true');
  }

}

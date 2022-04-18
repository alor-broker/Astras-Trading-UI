import { Component, OnInit } from '@angular/core';
import { filter, Observable, of, tap } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';

@Component({
  selector: 'ats-help-widget',
  templateUrl: './help-widget.component.html',
  styleUrls: ['./help-widget.component.less']
})
export class HelpWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  helpParams$?: Observable<string>;
  private params?: string;

  constructor(public modal: ModalService) {
  }

  ngOnInit() {
    this.helpParams$ = this.modal.helpParams$.pipe(
      filter((p): p is string => !!p),
      tap(p => this.params = p)
    );
    this.isVisible$ = this.modal.shouldShowHelpModal$;
  }

  handleClose() {
    this.modal.closeHelpModal();
  }
}

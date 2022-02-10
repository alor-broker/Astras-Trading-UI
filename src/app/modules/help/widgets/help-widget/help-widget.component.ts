import { Component, OnInit } from '@angular/core';
import { filter, Observable, of, Subscription, tap } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';

@Component({
  selector: 'ats-help-widget',
  templateUrl: './help-widget.component.html',
  styleUrls: ['./help-widget.component.less']
})
export class HelpWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  helpParams$?: Observable<string>;
  private sub: Subscription = new Subscription();
  private params?: string;

  constructor(public sync: SyncService) { }

  ngOnInit() {
    this.helpParams$ = this.sync.helpParams$.pipe(
      filter((p): p is string => !!p),
      tap(p => this.params = p)
    );
    this.isVisible$ = this.sync.shouldShowHelpModal$;
  }

  handleClose() {
    this.sync.closeHelpModal();
  }
}

import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';

@Component({
  selector: 'ats-terminal-settings-widget',
  templateUrl: './terminal-settings-widget.component.html',
  styleUrls: ['./terminal-settings-widget.component.less']
})
export class TerminalSettingsWidgetComponent implements OnInit {

  isVisible$: Observable<boolean> = of(false);

  constructor(private sync: SyncService) { }

  ngOnInit(): void {
    this.isVisible$ = this.sync.shouldShowTerminalSettingsModal$;
  }

  handleClose() {
    this.sync.closeTerminalSettingsModal();
  }
}

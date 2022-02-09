import { Component, OnInit } from '@angular/core';
import { NzTabChangeEvent, NzTabComponent } from 'ng-zorro-antd/tabs';
import { BehaviorSubject, filter, Observable, of } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';

type test = {index: number, tab: NzTabComponent}

@Component({
  selector: 'ats-command-widget',
  templateUrl: './command-widget.component.html',
  styleUrls: ['./command-widget.component.less'],
  providers: [ QuotesService ]
})
export class CommandWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  commandParams$?: Observable<CommandParams>;

  activeTab = new BehaviorSubject<string>('limit');

  constructor(public sync: SyncService) { }

  ngOnInit(): void {
    this.commandParams$ = this.sync.commandParams$.pipe(
      filter((p): p is CommandParams => !!p)
    );
    this.isVisible$ = this.sync.shouldShowCommandModal$;
  }

  handleOk(): void {
    this.sync.closeCommandModal();
  }

  handleCancel(): void {
    const close = () => this.sync.closeCommandModal();
    close();
  }

  tabChanged(newTab: NzTabChangeEvent) {
    if (newTab.tab.nzTitle == 'Рыночная') {
      this.activeTab.next('market')
    }
    else this.activeTab.next('limit')
  }
}

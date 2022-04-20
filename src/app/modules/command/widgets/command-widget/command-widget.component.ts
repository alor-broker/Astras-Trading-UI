import { Component, OnInit } from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import { BehaviorSubject, filter, Observable, of } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';

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

  constructor(public modal: ModalService) { }

  ngOnInit(): void {
    this.commandParams$ = this.modal.commandParams$.pipe(
      filter((p): p is CommandParams => !!p)
    );

    this.isVisible$ = this.modal.shouldShowCommandModal$;
  }

  handleCancel(): void {
    const close = () => this.modal.closeCommandModal();
    close();
  }

  tabChanged(newTab: NzTabChangeEvent) {
    if (newTab.tab.nzTitle == 'Рыночная') {
      this.activeTab.next('market')
    }
    else if (newTab.tab.nzTitle == 'Условная') {
      this.activeTab.next('stop')
    }
    else this.activeTab.next('limit')
  }

  openHelp() {
    this.modal.openHelpModal('new-order');
  }
}

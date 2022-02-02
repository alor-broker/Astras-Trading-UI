import { Component, OnInit } from '@angular/core';
import { NzTabChangeEvent, NzTabComponent } from 'ng-zorro-antd/tabs';
import { BehaviorSubject, filter, Observable, of, Subscription, tap } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandsService } from '../../services/commands.service';

type test = {index: number, tab: NzTabComponent}

@Component({
  selector: 'ats-edit-widget',
  templateUrl: './edit-widget.component.html',
  styleUrls: ['./edit-widget.component.less'],
  providers: [ QuotesService ]
})
export class EditWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  editParams$?: Observable<EditParams>;
  private sub: Subscription = new Subscription();
  private params?: EditParams;

  constructor(private command: CommandsService, public sync: SyncService) { }

  ngOnInit(): void {
    this.editParams$ = this.sync.editParams$.pipe(
      filter((p): p is EditParams => !!p),
      tap(p => this.params = p)
    );
    this.isVisible$ = this.sync.shouldShowEditModal$;
  }

  handleOk(): void {
    let sub;
    if (this.params?.type == 'limit') {
      sub = this.command.submitLimitEdit().subscribe(r => this.sync.closeEditModal());
    }
    else if (this.params?.type == 'market') {
      sub = this.command.submitMarketEdit().subscribe(r => this.sync.closeEditModal());
    }

    this.sub.add(sub);
    this.sync.closeEditModal();
  }

  handleCancel(): void {
    const close = () => this.sync.closeEditModal();
    close();
  }
}

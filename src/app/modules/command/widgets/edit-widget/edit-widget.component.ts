import { Component, OnInit } from '@angular/core';
import { NzTabComponent } from 'ng-zorro-antd/tabs';
import { filter, Observable, of, Subscription, tap } from 'rxjs';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
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

  constructor(private command: CommandsService, public modal: ModalService) { }

  ngOnInit(): void {
    this.editParams$ = this.modal.editParams$.pipe(
      filter((p): p is EditParams => !!p),
      tap(p => this.params = p)
    );
    this.isVisible$ = this.modal.shouldShowEditModal$;
  }

  handleOk(): void {
    let sub;
    if (this.params?.type == 'limit') {
      sub = this.command.submitLimitEdit().subscribe(r => this.modal.closeEditModal());
    }
    else if (this.params?.type == 'market') {
      sub = this.command.submitMarketEdit().subscribe(r => this.modal.closeEditModal());
    }

    this.sub.add(sub);
    this.modal.closeEditModal();
  }

  handleCancel(): void {
    const close = () => this.modal.closeEditModal();
    close();
  }
}

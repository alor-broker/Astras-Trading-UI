import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, Observable, of, Subject, take, tap } from 'rxjs';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-edit-widget',
  templateUrl: './edit-widget.component.html',
  styleUrls: ['./edit-widget.component.less'],
  providers: [QuotesService]
})
export class EditWidgetComponent implements OnInit, OnDestroy {
  isVisible$: Observable<boolean> = of(false);
  editParams$?: Observable<EditParams>;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private params?: EditParams;

  constructor(private command: CommandsService, public modal: ModalService) {
  }

  ngOnInit(): void {
    this.editParams$ = this.modal.editParams$.pipe(
      filter((p): p is EditParams => !!p),
      tap(p => this.params = p)
    );

    this.isVisible$ = this.modal.shouldShowEditModal$;
  }

  handleOk(): void {
    let command$ = of({});
    if (this.params?.type == 'limit') {
      command$ = this.command.submitLimitEdit();
    }
    else if (this.params?.type == 'market') {
      command$ = this.command.submitMarketEdit();
    }

    command$.pipe(
      take(1)
    ).subscribe(() => this.modal.closeEditModal());
  }

  handleCancel(): void {
    const close = () => this.modal.closeEditModal();
    close();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

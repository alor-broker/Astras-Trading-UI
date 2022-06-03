import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandsService } from '../../services/commands.service';
import { finalize } from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';

@Component({
  selector: 'ats-edit-widget',
  templateUrl: './edit-widget.component.html',
  styleUrls: ['./edit-widget.component.less'],
  providers: [QuotesService]
})
export class EditWidgetComponent implements OnInit, OnDestroy {
  isVisible$: Observable<boolean> = of(false);
  editParams$?: Observable<EditParams>;
  instrument$?: Observable<Instrument>;
  isBusy = false;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private params?: EditParams;

  constructor(private command: CommandsService, public modal: ModalService, private readonly instrumentService: InstrumentsService) {
  }

  ngOnInit(): void {
    this.editParams$ = this.modal.editParams$.pipe(
      filter((p): p is EditParams => !!p),
      tap(p => this.params = p)
    );

    this.instrument$ = this.editParams$.pipe(
      switchMap(c => this.instrumentService.getInstrument({
        symbol: c.instrument.symbol,
        instrumentGroup: c.instrument.instrumentGroup,
        exchange: c.instrument.exchange
      })),
      filter((i): i is Instrument => !!i)
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

    this.isBusy = true;
    command$.pipe(
      take(1),
      finalize(() => this.isBusy = false)
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

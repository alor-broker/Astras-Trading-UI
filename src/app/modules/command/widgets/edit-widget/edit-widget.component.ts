import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, filter, Observable, of, Subject, switchMap, take } from 'rxjs';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandsService } from '../../services/commands.service';
import { finalize, map } from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { CommandContextModel } from '../../models/command-context.model';

@Component({
  selector: 'ats-edit-widget',
  templateUrl: './edit-widget.component.html',
  styleUrls: ['./edit-widget.component.less'],
  providers: [QuotesService]
})
export class EditWidgetComponent implements OnInit, OnDestroy {
  isVisible$: Observable<boolean> = of(false);
  commandContext$?: Observable<CommandContextModel<EditParams>>;
  instrument$?: Observable<Instrument>;
  isBusy = false;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private command: CommandsService, public modal: ModalService, private readonly instrumentService: InstrumentsService) {
  }

  ngOnInit(): void {
    this.commandContext$ = this.modal.editParams$.pipe(
      filter((p): p is EditParams => !!p),
      switchMap(p => combineLatest([
          of(p),
          this.instrumentService.getInstrument(p.instrument)
            .pipe(
              filter((i): i is Instrument => !!i)
            )
        ]
      )),
      map(([params, instrument]) => ({
        commandParameters: params,
        instrument: instrument
      }))
    );

    this.isVisible$ = this.modal.shouldShowEditModal$;
  }

  handleOk(): void {
    this.commandContext$?.pipe(
      take(1)
    ).subscribe(context => {
      let command$ = of({});
      if (context.commandParameters?.type == 'limit') {
        command$ = this.command.submitLimitEdit();
      }
      else if (context.commandParameters?.type == 'market') {
        command$ = this.command.submitMarketEdit();
      }

      this.isBusy = true;
      command$.pipe(
        take(1),
        finalize(() => this.isBusy = false)
      ).subscribe(() => this.modal.closeEditModal());
    });
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

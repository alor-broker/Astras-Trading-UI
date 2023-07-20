import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import { combineLatest, filter, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { EditParams } from 'src/app/shared/models/commands/edit-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';
import { finalize, map } from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { CommandContextModel } from '../../models/command-context.model';
import { LimitEdit } from "../../models/limit-edit.model";
import { StopEdit } from "../../models/stop-edit";

@Component({
  selector: 'ats-edit-widget',
  templateUrl: './edit-widget.component.html',
  styleUrls: ['./edit-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  commandContext$?: Observable<CommandContextModel<EditParams>>;
  isBusy = false;
  command$!: Observable<LimitEdit | StopEdit | null>;

  qtyChanges$ = new Subject<{ quantity: number }>();

  constructor(
    private command: CommandsService,
    public modal: ModalService,
    private readonly instrumentService: InstrumentsService
  ) {
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
      })),
      tap(({commandParameters}) => {
        if (commandParameters.type === 'limit') {
            this.command$ = this.command.getLimitEdit();
        } else {
          this.command$ = this.command.getStopEdit();
        }
      })
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
      if (context.commandParameters?.type == 'stoplimit') {
        command$ = this.command.submitStopLimitEdit();
      }
      if (context.commandParameters?.type == 'stop') {
        command$ = this.command.submitStopMarketEdit();
      }

      this.isBusy = true;
      command$.pipe(
        take(1),
        finalize(() => this.isBusy = false)
      ).subscribe(() => this.modal.closeEditModal());
    });
  }

  handleCancel(): void {
    const close = () => {
      this.modal.closeEditModal();
      this.commandContext$?.pipe(
        take(1),
        filter(x => !!x.commandParameters.cancelled)
      ).subscribe(x => x.commandParameters.cancelled!());
    };

    close();
  }
}

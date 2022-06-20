import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, Observable, of, switchMap, take } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandType } from '../../../../shared/models/enums/command-type.model';
import { NzTabComponent, NzTabSetComponent } from 'ng-zorro-antd/tabs';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { map } from 'rxjs/operators';
import { CommandContextModel } from '../../models/command-context.model';

@Component({
  selector: 'ats-command-widget',
  templateUrl: './command-widget.component.html',
  styleUrls: ['./command-widget.component.less'],
  providers: [QuotesService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandWidgetComponent implements OnInit {
  readonly commandTypes = CommandType;

  @ViewChild('commandTabs', { static: false }) commandTabs?: NzTabSetComponent;
  @ViewChild('limitTab', { static: false }) limitTab?: NzTabComponent;
  @ViewChild('marketTab', { static: false }) marketTab?: NzTabComponent;
  @ViewChild('stopTab', { static: false }) stopTab?: NzTabComponent;

  isVisible$: Observable<boolean> = of(false);
  commandContext$?: Observable<CommandContextModel<CommandParams>>;
  selectedCommandType$ = new BehaviorSubject<CommandType>(CommandType.Limit);

  constructor(
    private readonly modal: ModalService,
    private readonly instrumentService: InstrumentsService) {
  }

  ngOnInit(): void {
    this.commandContext$ = this.modal.commandParams$.pipe(
      filter((p): p is CommandParams => !!p),
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

    this.isVisible$ = this.modal.shouldShowCommandModal$;
  }

  handleCancel(): void {
    const close = () => this.modal.closeCommandModal();
    close();
  }

  setSelectedCommandType(commandType: CommandType) {
    this.selectedCommandType$.next(commandType);
  }

  openHelp() {
    this.modal.openHelpModal('new-order');
  }

  public setInitialCommandTab() {
    this.commandContext$?.pipe(
      take(1)
    ).subscribe(context => {
      switch (context.commandParameters.type) {
        case CommandType.Limit:
          this.activateCommandTab(this.limitTab);
          break;
        case CommandType.Market:
          this.activateCommandTab(this.marketTab);
          break;
        case CommandType.Stop:
          this.activateCommandTab(this.stopTab);
          break;
        default:
          throw new Error(`Unknown command type ${context.commandParameters.type}`);
      }

      this.setSelectedCommandType(context.commandParameters.type);
    });
  }

  private activateCommandTab(targetTab?: NzTabComponent) {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    this.commandTabs?.setSelectedIndex(targetTab.position);
  }
}

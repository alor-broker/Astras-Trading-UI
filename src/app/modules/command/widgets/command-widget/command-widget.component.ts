import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, filter, Observable, of, take } from 'rxjs';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandType } from '../../../../shared/models/enums/command-type.model';
import { NzTabComponent, NzTabSetComponent } from 'ng-zorro-antd/tabs';

@Component({
  selector: 'ats-command-widget',
  templateUrl: './command-widget.component.html',
  styleUrls: ['./command-widget.component.less'],
  providers: [ QuotesService ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandWidgetComponent implements OnInit {
  readonly commandTypes = CommandType;

  @ViewChild('commandTabs', {static: false}) commandTabs?: NzTabSetComponent;
  @ViewChild('limitTab', {static: false}) limitTab?: NzTabComponent;
  @ViewChild('marketTab', {static: false}) marketTab?: NzTabComponent;
  @ViewChild('stopTab', {static: false}) stopTab?: NzTabComponent;

  isVisible$: Observable<boolean> = of(false);
  commandParams$?: Observable<CommandParams>;

  selectedCommandType$ = new BehaviorSubject<CommandType>(CommandType.Limit);

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

  setSelectedCommandType(commandType: CommandType) {
    this.selectedCommandType$.next(commandType);
  }

  openHelp() {
    this.modal.openHelpModal('new-order');
  }

  public setInitialCommandTab() {
    this.commandParams$?.pipe(
        take(1)
      ).subscribe(params => {
      switch (params.type){
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
          throw new Error(`Unknown command type ${params.type}`);
      }

      this.setSelectedCommandType(params.type);
    });
  }

  private activateCommandTab(targetTab?: NzTabComponent) {
    if(!targetTab || targetTab.position == null) {
      return;
    }

    this.commandTabs?.setSelectedIndex(targetTab.position);
  }
}

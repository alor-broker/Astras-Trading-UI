import { Component, Input } from '@angular/core';
import { of, take } from 'rxjs';
import { Side } from 'src/app/shared/models/enums/side.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';
import { CommandType } from '../../../../shared/models/enums/command-type.model';

@Component({
  selector: 'ats-command-footer[activeCommandType]',
  templateUrl: './command-footer.component.html',
  styleUrls: ['./command-footer.component.less']
})
export class CommandFooterComponent {
  @Input()
  activeCommandType = CommandType.Limit;

  constructor(private command: CommandsService, private modal: ModalService) {
  }

  buy() {
    let command$ = of({});
    if (this.activeCommandType === CommandType.Limit) {
      command$ = this.command.submitLimit(Side.Buy);
    }
    else if (this.activeCommandType === CommandType.Market) {
      command$ = this.command.submitMarket(Side.Buy);
    }
    else if (this.activeCommandType === CommandType.Stop) {
      command$ = this.command.submitStop(Side.Buy);
    }

    command$.pipe(
      take(1)
    ).subscribe(() => this.closeModal());
  }

  sell() {
    let command$ = of({});
    if (this.activeCommandType === CommandType.Limit) {
      command$ = this.command.submitLimit(Side.Sell);
    }
    else if (this.activeCommandType === CommandType.Market) {
      command$ = this.command.submitMarket(Side.Sell);
    }
    else if (this.activeCommandType === CommandType.Stop) {
      command$ = this.command.submitStop(Side.Sell);
    }

    command$.pipe(
      take(1)
    ).subscribe(() => this.closeModal());
  }

  closeModal() {
    this.modal.closeCommandModal();
  }
}

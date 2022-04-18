import { Component, Input, OnInit } from '@angular/core';
import { of, take } from 'rxjs';
import { Side } from 'src/app/shared/models/enums/side.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-command-footer[activeTab]',
  templateUrl: './command-footer.component.html',
  styleUrls: ['./command-footer.component.less']
})
export class CommandFooterComponent implements OnInit {
  @Input()
  activeTab: string = 'limit'

  constructor(private command: CommandsService, private modal: ModalService) {
  }

  ngOnInit(): void {

  }

  buy() {
    let command$ = of({});
    if (this.activeTab == 'limit') {
      command$ = this.command.submitLimit(Side.Buy);
    }
    else if (this.activeTab == 'market') {
      command$ = this.command.submitMarket(Side.Buy);
    }
    else if (this.activeTab == 'stop') {
      command$ = this.command.submitStop(Side.Buy);
    }

    command$.pipe(
      take(1)
    ).subscribe(() => this.closeModal());
  }

  sell() {
    let command$ = of({});
    if (this.activeTab == 'limit') {
      command$ = this.command.submitLimit(Side.Sell);
    }
    else if (this.activeTab == 'market') {
      command$ = this.command.submitMarket(Side.Sell);
    }
    else if (this.activeTab == 'stop') {
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

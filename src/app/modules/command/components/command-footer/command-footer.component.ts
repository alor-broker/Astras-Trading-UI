import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { Side } from 'src/app/shared/models/enums/side.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-command-footer[activeTab]',
  templateUrl: './command-footer.component.html',
  styleUrls: ['./command-footer.component.less']
})
export class CommandFooterComponent implements OnInit, OnDestroy {
  @Input()
  activeTab: string = 'limit'

  private sub: Subscription = new Subscription();

  constructor(private command: CommandsService, private sync: SyncService) { }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  buy() {
    let sub;
    if (this.activeTab == 'limit') {
      sub = this.command.submitLimit(Side.Buy).subscribe(r => this.closeModal());
    }
    else if (this.activeTab == 'market') {
      sub = this.command.submitMarket(Side.Buy).subscribe(r => this.closeModal());
    }

    this.sub.add(sub);
  }

  sell() {
    let sub;
    if (this.activeTab == 'limit') {
      sub = this.command.submitLimit(Side.Sell).subscribe(r => this.closeModal());
    }
    else if (this.activeTab == 'market') {
      sub = this.command.submitMarket(Side.Sell).subscribe(r => this.closeModal());
    }

    this.sub.add(sub);
  }

  closeModal() {
    this.sync.closeCommandModal()
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, of, take } from 'rxjs';
import { Side } from 'src/app/shared/models/enums/side.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';
import { CommandType } from '../../../../shared/models/enums/command-type.model';
import { finalize } from 'rxjs/operators';
import { SubmitOrderResult } from "../../models/order.model";
import { StopCommand } from "../../models/stop-command.model";
import { LimitCommand } from "../../models/limit-command.model";
import { MarketCommand } from "../../models/market-command.model";

@Component({
  selector: 'ats-command-footer',
  templateUrl: './command-footer.component.html',
  styleUrls: ['./command-footer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandFooterComponent implements OnChanges {
  @Input({required: true})
  activeCommandType = CommandType.Limit;

  isBuyButtonLoading = false;
  isSellButtonLoading = false;

  command$: Observable<StopCommand | LimitCommand | MarketCommand | null> = of(null);

  constructor(
    private readonly command: CommandsService,
    private readonly modal: ModalService,
    private readonly changeDetector: ChangeDetectorRef) {
  }

  get isButtonsLocked(): boolean {
    return this.isBuyButtonLoading || this.isSellButtonLoading;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.activeCommandType?.currentValue) {
      switch (this.activeCommandType) {
        case CommandType.Limit:
          this.command$ = this.command.getLimitCommand();
          break;
        case CommandType.Stop:
          this.command$ = this.command.getStopCommand();
          break;
        case CommandType.Market:
          this.command$ = this.command.getMarketCommand();
          break;
      }
    }
  }

  buy() {
    let command$: Observable<SubmitOrderResult> | null = null;
    if (this.activeCommandType === CommandType.Limit) {
      command$ = this.command.submitLimit(Side.Buy);
    } else if (this.activeCommandType === CommandType.Market) {
      command$ = this.command.submitMarket(Side.Buy);
    } else if (this.activeCommandType === CommandType.Stop) {
      command$ = this.command.submitStop(Side.Buy);
    }

    this.isBuyButtonLoading = true;

    command$?.pipe(
      take(1),
      finalize(() => this.executeAndDetectChanges(() => this.isBuyButtonLoading = false)),
    ).subscribe({
      next: (res?: any) => {
        if (res) {
          this.closeModal();
        }
      },
      error: () => null
    });
  }

  sell() {
    let command$: Observable<SubmitOrderResult> | null = null;
    if (this.activeCommandType === CommandType.Limit) {
      command$ = this.command.submitLimit(Side.Sell);
    } else if (this.activeCommandType === CommandType.Market) {
      command$ = this.command.submitMarket(Side.Sell);
    } else if (this.activeCommandType === CommandType.Stop) {
      command$ = this.command.submitStop(Side.Sell);
    }

    this.isSellButtonLoading = true;

    command$?.pipe(
      take(1),
      finalize(() => this.executeAndDetectChanges(() => this.isSellButtonLoading = false))
    ).subscribe({
      next: (res?: any) => {
        if (res) {
          this.closeModal();
        }
      },
      error: () => null
    });
  }

  closeModal() {
    this.modal.closeCommandModal();
  }

  private executeAndDetectChanges(action: () => void) {
    // Have to explicitly call change detection  due to the anomalous behavior of the observable in case of an error
    // Angular does not do change detection in this case
    // https://github.com/angular/angular/issues/17772
    // Using BehaviourSubject instead of local variable and 'changeDetection: ChangeDetectionStrategy.OnPush' does not solve the issue
    action();
    this.changeDetector.markForCheck();
  }
}

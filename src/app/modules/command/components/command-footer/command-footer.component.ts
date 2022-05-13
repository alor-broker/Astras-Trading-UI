import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { of, take } from 'rxjs';
import { Side } from 'src/app/shared/models/enums/side.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';
import { CommandType } from '../../../../shared/models/enums/command-type.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'ats-command-footer[activeCommandType]',
  templateUrl: './command-footer.component.html',
  styleUrls: ['./command-footer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandFooterComponent {
  @Input()
  activeCommandType = CommandType.Limit;

  isBuyButtonLoading = false;
  isSellButtonLoading = false;

  constructor(
    private readonly command: CommandsService,
    private readonly modal: ModalService,
    private readonly changeDetector: ChangeDetectorRef) {
  }

  get isButtonsLocked(): boolean {
    return this.isBuyButtonLoading || this.isSellButtonLoading;
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

    this.isBuyButtonLoading = true;

    command$.pipe(
      take(1),
      finalize(() => this.executeAndDetectChanges(() => this.isBuyButtonLoading = false))
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

    this.isSellButtonLoading = true;

    command$.pipe(
      take(1),
      finalize(() => this.executeAndDetectChanges(() => this.isSellButtonLoading = false))
    ).subscribe(() => this.closeModal());
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

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {ScalperCommandProcessorService} from '../../services/scalper-command-processor.service';
import {
  combineLatest,
  Observable
} from 'rxjs';
import {map} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {ScalperOrderBookMouseAction} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

@Component({
  selector: 'ats-possible-actions-panel',
  templateUrl: './possible-actions-panel.html',
  styleUrls: ['./possible-actions-panel.less'],
  imports: [
    TranslocoDirective,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PossibleActionsPanel implements OnInit {
  currentActions$!: Observable<string[] | null>;

  private readonly commandProcessorService = inject(ScalperCommandProcessorService);

  private readonly translatorService = inject(TranslatorService);

  ngOnInit(): void {
    this.currentActions$ = combineLatest([
      this.translatorService.getTranslator('scalper-order-book/possible-actions-panel'),
      this.commandProcessorService.getPossibleActions()
    ]).pipe(
      map(([translator, actions]) => {
        if (actions.length === 0) {
          return null;
        }

        const uniqueActions = [...new Set(actions.map(x => this.actionToDisplay(x)))];

        return uniqueActions.map(x => translator(['actions', x], {fallback: x}));
      })
    );
  }

  private actionToDisplay(action: ScalperOrderBookMouseAction): string {
    switch (action) {
      case ScalperOrderBookMouseAction.LimitBuyOrder:
      case ScalperOrderBookMouseAction.LimitSellOrder:
        return 'limitOrder';
      case ScalperOrderBookMouseAction.MarketBuyOrder:
      case ScalperOrderBookMouseAction.MarketSellOrder:
        return 'marketOrder';
      case ScalperOrderBookMouseAction.StopLimitBuyOrder:
      case ScalperOrderBookMouseAction.StopLimitSellOrder:
        return 'stopLimitOrder';
      default:
        return action;
    }
  }
}

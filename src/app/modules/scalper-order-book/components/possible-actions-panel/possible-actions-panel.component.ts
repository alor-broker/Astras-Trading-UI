import {
  Component,
  OnInit
} from '@angular/core';
import { ScalperCommandProcessorService } from '../../services/scalper-command-processor.service';
import {
  combineLatest,
  Observable
} from 'rxjs';
import { map } from 'rxjs/operators';
import { ScalperOrderBookMouseAction } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { TranslatorService } from '../../../../shared/services/translator.service';

@Component({
  selector: 'ats-possible-actions-panel',
  templateUrl: './possible-actions-panel.component.html',
  styleUrls: ['./possible-actions-panel.component.less']
})
export class PossibleActionsPanelComponent implements OnInit {
  currentActions$!: Observable<string[] | null>;

  constructor(
    private readonly commandProcessorService: ScalperCommandProcessorService,
    private readonly translatorService: TranslatorService
  ) {
  }

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

        return uniqueActions.map(x => translator(['actions', x], { fallback: x }));
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

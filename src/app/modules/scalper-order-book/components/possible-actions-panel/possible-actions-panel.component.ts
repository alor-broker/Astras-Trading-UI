import { Component, OnInit, inject } from '@angular/core';
import { ScalperCommandProcessorService } from '../../services/scalper-command-processor.service';
import {
  combineLatest,
  Observable
} from 'rxjs';
import { map } from 'rxjs/operators';
import { ScalperOrderBookMouseAction } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { TranslatorService } from '../../../../shared/services/translator.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'ats-possible-actions-panel',
    templateUrl: './possible-actions-panel.component.html',
    styleUrls: ['./possible-actions-panel.component.less'],
    imports: [
      TranslocoDirective,
      AsyncPipe
    ]
})
export class PossibleActionsPanelComponent implements OnInit {
  private readonly commandProcessorService = inject(ScalperCommandProcessorService);
  private readonly translatorService = inject(TranslatorService);

  currentActions$!: Observable<string[] | null>;

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

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {
  filter,
  shareReplay,
  switchMap
} from "rxjs";
import {
  CommonParameters,
  CommonParametersService
} from "../../../order-commands/services/common-parameters.service";
import {AsyncPipe} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {toObservable} from "@angular/core/rxjs-interop";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {IdeaSymbol} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {MarketOrderConfig} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {CompactHeader} from '@terminal-widgets-lib/widgets/order-commands/components/compact-header/compact-header';
import {MarketOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/market-order-form/market-order-form';

@Component({
  selector: 'ats-submit-order-for-symbol',
  imports: [
    AsyncPipe,
    TranslocoDirective,
    CompactHeader,
    MarketOrderForm,
  ],
  templateUrl: './submit-order-for-symbol.html',
  styleUrl: './submit-order-for-symbol.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    CommonParametersService
  ]
})
export class SubmitOrderForSymbol {
  readonly symbol = input.required<IdeaSymbol>();

  protected readonly marketOrderConfig: MarketOrderConfig = {
    unsupportedFields: {}
  };

  private readonly dashboardContextServiced = inject(DASHBOARD_CONTEXT_SERVICE);

  protected readonly selectedPortfolio$ = this.dashboardContextServiced.selectedPortfolio$;

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly commonParametersService = inject(CommonParametersService);

  private readonly symbolChanges$ = toObservable(this.symbol);

  protected readonly targetInstrument$ = this.symbolChanges$.pipe(
    filter(i => i != null),
    switchMap(i => this.instrumentsService.getInstrument({symbol: i.ticker, exchange: i.exchange})),
    filter(i => i != null),
    shareReplay(1)
  );

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }
}

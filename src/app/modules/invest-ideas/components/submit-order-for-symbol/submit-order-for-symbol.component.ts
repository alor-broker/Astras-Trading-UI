import { Component, input, inject } from '@angular/core';
import {filter, shareReplay, switchMap} from "rxjs";
import {IdeaSymbol} from "../../services/invest-ideas-service-typings";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {CommonParameters, CommonParametersService} from "../../../order-commands/services/common-parameters.service";
import {AsyncPipe} from "@angular/common";
import {CompactHeaderComponent} from "../../../order-commands/components/compact-header/compact-header.component";
import {TranslocoDirective} from "@jsverse/transloco";
import {ConfirmableOrderCommandsService} from "../../../order-commands/services/confirmable-order-commands.service";
import {
  MarketOrderFormComponent
} from "../../../order-commands/components/order-forms/market-order-form/market-order-form.component";
import {toObservable} from "@angular/core/rxjs-interop";
import {MarketOrderConfig} from "../../../../shared/models/orders/orders-config.model";

@Component({
  selector: 'ats-submit-order-for-symbol',
  imports: [
    AsyncPipe,
    CompactHeaderComponent,
    TranslocoDirective,
    MarketOrderFormComponent
  ],
  templateUrl: './submit-order-for-symbol.component.html',
  styleUrl: './submit-order-for-symbol.component.less',
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ]
})
export class SubmitOrderForSymbolComponent {
  private readonly dashboardContextServiced = inject(DashboardContextService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly commonParametersService = inject(CommonParametersService);

  readonly symbol = input.required<IdeaSymbol>();
  protected readonly selectedPortfolio$ = this.dashboardContextServiced.selectedPortfolio$;
  private readonly symbolChanges$ = toObservable(this.symbol);
  protected readonly targetInstrument$ = this.symbolChanges$.pipe(
    filter(i => i != null),
    switchMap(i => this.instrumentsService.getInstrument({symbol: i.ticker, exchange: i.exchange})),
    filter(i => i != null),
    shareReplay(1)
  );

  protected readonly marketOrderConfig: MarketOrderConfig = {
    unsupportedFields: {}
  };

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }
}

import {
  Component,
  DestroyRef,
  Input
} from '@angular/core';
import {
  BehaviorSubject,
  filter,
  shareReplay,
  switchMap
} from "rxjs";
import { IdeaSymbol } from "../../services/invest-ideas-service-typings";
import { LimitOrderConfig } from "../../../../shared/models/orders/orders-config.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import {
  CommonParameters,
  CommonParametersService
} from "../../../order-commands/services/common-parameters.service";
import { AsyncPipe } from "@angular/common";
import { CompactHeaderComponent } from "../../../order-commands/components/compact-header/compact-header.component";
import { OrderCommandsModule } from "../../../order-commands/order-commands.module";
import { TranslocoDirective } from "@jsverse/transloco";
import { ConfirmableOrderCommandsService } from "../../../order-commands/services/confirmable-order-commands.service";

@Component({
  selector: 'ats-submit-order-for-symbol',
  imports: [
    AsyncPipe,
    CompactHeaderComponent,
    OrderCommandsModule,
    TranslocoDirective
  ],
  templateUrl: './submit-order-for-symbol.component.html',
  styleUrl: './submit-order-for-symbol.component.less',
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ]
})
export class SubmitOrderForSymbolComponent {
  protected readonly targetSymbol$ = new BehaviorSubject<IdeaSymbol | null>(null);

  protected readonly selectedPortfolio$ = this.dashboardContextServiced.selectedPortfolio$;

  protected readonly targetInstrument$ = this.targetSymbol$.pipe(
    filter(i => i != null),
    switchMap(i => this.instrumentsService.getInstrument({symbol: i.ticker, exchange: i.exchange})),
    filter(i => i != null),
    shareReplay(1)
  );

  protected readonly limitOrderConfig: LimitOrderConfig = {
    isBracketsSupported: false,
    unsupportedFields: {
      reason: true,
      advanced: true
    }
  };

  constructor(
    private readonly dashboardContextServiced: DashboardContextService,
    private readonly instrumentsService: InstrumentsService,
    private readonly commonParametersService: CommonParametersService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  @Input({required: true})
  set symbol(value: IdeaSymbol) {
    this.targetSymbol$.next(value);
  }

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }
}

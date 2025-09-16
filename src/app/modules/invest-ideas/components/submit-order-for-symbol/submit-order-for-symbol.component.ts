import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  asyncScheduler,
  BehaviorSubject,
  filter,
  shareReplay,
  subscribeOn,
  switchMap
} from "rxjs";
import { IdeaSymbol } from "../../services/invest-ideas-service-typings";
import { LimitOrderConfig } from "../../../../shared/models/orders/orders-config.model";
import { LimitOrderFormComponent } from "../../../order-commands/components/order-forms/limit-order-form/limit-order-form.component";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import {
  CommonParameters,
  CommonParametersService
} from "../../../order-commands/services/common-parameters.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
export class SubmitOrderForSymbolComponent implements OnInit {
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

  @ViewChild('limitOrderForm')
  protected limitOrderForm?: LimitOrderFormComponent;

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

  ngOnInit(): void {
    this.targetInstrument$.pipe(
      takeUntilDestroyed(this.destroyRef),
      subscribeOn(asyncScheduler)
    ).subscribe(() => this.limitOrderForm?.updateEvaluation());
  }

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }
}

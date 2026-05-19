import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from "ng-zorro-antd/radio";
import {FormsModule} from "@angular/forms";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe} from "@angular/common";
import {
  combineLatest,
  filter,
  shareReplay,
  switchMap
} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import {OrderTarget} from "../order-forms/order-form-base";
import {map} from "rxjs/operators";
import {InstrumentKey} from "@terminal-core-lib/common/types/instrument.types";
import {Side} from '@terminal-core-lib/common/types/side.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {CommonParametersService} from '@terminal-widgets-lib/widgets/order-commands/services/common-parameters.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {TradeScreenMarketOrderForm} from '@terminal-widgets-lib/widgets/mobile-trade-screen/components/order-forms/trade-screen-market-order-form/trade-screen-market-order-form';
import {TradeScreenLimitOrderForm} from '@terminal-widgets-lib/widgets/mobile-trade-screen/components/order-forms/trade-screen-limit-order-form/trade-screen-limit-order-form';

@Component({
  selector: 'ats-trade-screen-submit-order-form',
  imports: [
    NzRadioGroupComponent,
    FormsModule,
    NzRadioComponent,
    TranslocoDirective,
    AsyncPipe,
    NzSelectComponent,
    NzOptionComponent,
    TradeScreenMarketOrderForm,
    TradeScreenLimitOrderForm,
  ],
  templateUrl: './trade-screen-submit-order-form.html',
  styleUrl: './trade-screen-submit-order-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    CommonParametersService
  ]
})
export class TradeScreenSubmitOrderForm {
  readonly targetInstrument = input.required<InstrumentKey>();

  readonly price = input<number>();

  readonly formType = model<'limit' | 'market'>('limit');

  readonly side = model(Side.Buy);

  readonly submitted = output();

  protected readonly Sides = Side;

  private readonly dashboardContextServiced = inject(DASHBOARD_CONTEXT_SERVICE);

  protected readonly selectedPortfolio$ = this.dashboardContextServiced.selectedPortfolio$;

  private readonly commonParametersService = inject(CommonParametersService);

  private readonly instrumentsService = inject(InstrumentsService);

  protected readonly instrumentInfo$ = toObservable(this.targetInstrument).pipe(
    switchMap(i => this.instrumentsService.getInstrument(i)),
    filter(i => i != null),
    shareReplay(1)
  );

  protected readonly orderTarget$ = combineLatest({
    targetPortfolio: this.selectedPortfolio$,
    targetInstrument: this.instrumentInfo$
  }).pipe(
    map(x => {
      return {
        targetPortfolio: {
          portfolio: x.targetPortfolio.portfolio,
          exchange: x.targetPortfolio.exchange,
        },
        instrument: {
          symbol: x.targetInstrument.symbol,
          exchange: x.targetInstrument.exchange,
          instrumentGroup: x.targetInstrument.instrumentGroup,
          lotSize: x.targetInstrument.lotsize ?? 1,
          priceStep: x.targetInstrument.minstep
        }
      } satisfies OrderTarget;
    })
  );

  constructor() {
    effect(() => {
      const price = this.price();
      if (price != null) {
        this.commonParametersService.setParameters({
          price
        });
      }
    });
  }
}

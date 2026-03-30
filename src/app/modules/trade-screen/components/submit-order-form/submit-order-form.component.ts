import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  output
} from '@angular/core';
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from "ng-zorro-antd/radio";
import { FormsModule } from "@angular/forms";
import { TranslocoDirective } from "@jsverse/transloco";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { AsyncPipe } from "@angular/common";
import {
  combineLatest,
  filter,
  shareReplay,
  switchMap
} from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { LimitOrderConfig } from "../../../../shared/models/orders/orders-config.model";
import { CommonParametersService } from "../../../order-commands/services/common-parameters.service";
import { ConfirmableOrderCommandsService } from "../../../order-commands/services/confirmable-order-commands.service";
import { Side } from "../../../../shared/models/enums/side.model";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import { MarketOrderFormComponent } from "../order-forms/market-order-form/market-order-form.component";
import { OrderTarget } from "../order-forms/order-form-base";
import { map } from "rxjs/operators";
import { LimitOrderFormComponent } from "../order-forms/limit-order-form/limit-order-form.component";

@Component({
  selector: 'ats-submit-order-form',
  imports: [
    NzRadioGroupComponent,
    FormsModule,
    NzRadioComponent,
    TranslocoDirective,
    AsyncPipe,
    NzSelectComponent,
    NzOptionComponent,
    MarketOrderFormComponent,
    LimitOrderFormComponent
  ],
  templateUrl: './submit-order-form.component.html',
  styleUrl: './submit-order-form.component.less',
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitOrderFormComponent {
  readonly targetInstrument = input.required<InstrumentKey>();

  readonly price = input<number>();

  readonly formType = model<'limit' | 'market'>('limit');

  readonly side = model(Side.Buy);

  readonly submitted = output();

  protected readonly Sides = Side;

  protected readonly limitOrderConfig: LimitOrderConfig = {
    isBracketsSupported: false,
    unsupportedFields: {
      reason: true,
      advanced: true
    }
  };

  private readonly dashboardContextServiced = inject(DashboardContextService);

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
